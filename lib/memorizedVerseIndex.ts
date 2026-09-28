import type { BibleBook, MemorizedEntity, PathProgress } from "@/types";
import { resolvePath } from "@/lib/memorizationContent";
import { buildPathDayPlan } from "@/lib/dayPlan";
import { getChapterVerses } from "@/lib/chapterContent";
import { BOOK_VERSE_COUNTS } from "@/lib/esvUsageLimits";

// Every memorized verse the reader has, by `${book}|${chapter}` — from ALL of their progress, not
// just whichever path the Mind Map happens to be drawing: every verse in spaced review (any path,
// or added by hand), plus each path's own learned lessons and prior-known verses. So the map's
// progress rings read the same wherever you are on it.
export type MemorizedVerseIndex = Map<string, Set<number>>;

function add(index: MemorizedVerseIndex, book: string, chapter: number, verse: number): void {
  const key = `${book}|${chapter}`;
  const set = index.get(key) ?? new Set<number>();
  set.add(verse);
  index.set(key, set);
}

let cached: { paths: Record<string, PathProgress>; entities: MemorizedEntity[]; index: MemorizedVerseIndex } | null = null;

export function buildMemorizedVerseIndex(paths: Record<string, PathProgress>, entities: MemorizedEntity[]): MemorizedVerseIndex {
  if (cached && cached.paths === paths && cached.entities === entities) return cached.index;
  const index: MemorizedVerseIndex = new Map();
  for (const entity of entities) {
    for (let verse = entity.startVerse; verse <= entity.endVerse; verse++) add(index, entity.book, entity.chapter, verse);
  }
  for (const [key, plan] of Object.entries(paths)) {
    const verses = resolvePath(key)?.verses;
    if (!verses) continue;
    for (const verse of verses.slice(0, plan.priorKnownVerseCount ?? 0)) add(index, verse.book, verse.chapter, verse.verseNumber);
    for (const day of buildPathDayPlan(key, verses, plan)) {
      if (day.kind !== "learn" || day.dayNumber > plan.completedDays) continue;
      for (const verse of day.newVerses) add(index, verse.book, verse.chapter, verse.verseNumber);
    }
  }
  cached = { paths, entities, index };
  return index;
}

// How many verses a chapter has, from its cached text (skipping a translation's empty gap
// verses) — undefined when it isn't cached on this device.
function chapterTotal(book: string, chapter: number): number | undefined {
  const verses = getChapterVerses(book, chapter);
  return verses && verses.length > 0 ? verses.filter((verse) => verse.text.trim().length > 0).length : undefined;
}

// A chapter's 0..1 share memorized — 0 when its length isn't known yet (text not cached).
export function chapterMemorizedFraction(index: MemorizedVerseIndex, book: string, chapter: number): number {
  const done = index.get(`${book}|${chapter}`)?.size ?? 0;
  if (done === 0) return 0;
  const total = chapterTotal(book, chapter);
  return total ? Math.min(1, done / total) : 0;
}

// A book's (or its chapters `from`..`to`'s) 0..1 share memorized. Chapter lengths come from cached
// text where there is some; otherwise the book's known verse total is spread evenly per chapter.
export function bookMemorizedFraction(index: MemorizedVerseIndex, book: BibleBook, from = 1, to = book.chapterCount): number {
  const average = (BOOK_VERSE_COUNTS[book.name] ?? 0) / book.chapterCount;
  let done = 0;
  let total = 0;
  for (let chapter = from; chapter <= to; chapter++) {
    const count = index.get(`${book.name}|${chapter}`)?.size ?? 0;
    const length = chapterTotal(book.name, chapter) ?? Math.max(average, count);
    done += Math.min(count, length);
    total += length;
  }
  return total > 0 ? Math.min(1, done / total) : 0;
}
