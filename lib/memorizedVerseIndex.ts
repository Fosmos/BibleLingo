import type { BibleBook, MemorizedEntity, PathProgress } from "@/types";
import { learnedVersesOfDay } from "@/lib/dayVerseProgress";
import { resolvePath } from "@/lib/memorizationContent";
import { buildPathDayPlan } from "@/lib/dayPlan";
import { getChapterVerses } from "@/lib/chapterContent";
import { getChapterVerseNumbers } from "@/lib/chapterVerseIndex";
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
      for (const verse of learnedVersesOfDay(day, plan)) add(index, verse.book, verse.chapter, verse.verseNumber);
    }
  }
  cached = { paths, entities, index };
  return index;
}

// A chapter's verse numbers (skipping a translation's empty gap verses) — from its cached text, or
// the numbers remembered for good once it's been loaded (lib/chapterVerseIndex.ts: the ESV's storage
// cap clears a memorized book's text, never these). Undefined when it's never been loaded here.
function chapterVerseNumbers(book: string, chapter: number): number[] | undefined {
  const verses = getChapterVerses(book, chapter);
  if (verses && verses.length > 0) return verses.filter((verse) => verse.text.trim().length > 0).map((verse) => verse.verseNumber);
  return getChapterVerseNumbers(book, chapter);
}

// How many of a chapter's verses are memorized, and of how many — only its real verses counted, so a
// gap verse never holds a whole chapter short of complete. Its length unknown when never loaded here.
function chapterCount(index: MemorizedVerseIndex, book: string, chapter: number): { done: number; total: number | undefined } {
  const memorized = index.get(`${book}|${chapter}`);
  const numbers = chapterVerseNumbers(book, chapter);
  if (!numbers?.length) return { done: memorized?.size ?? 0, total: undefined };
  return { done: memorized ? numbers.filter((number) => memorized.has(number)).length : 0, total: numbers.length };
}

// A chapter's 0..1 share memorized — 0 when its length isn't known yet (never loaded here).
export function chapterMemorizedFraction(index: MemorizedVerseIndex, book: string, chapter: number): number {
  const { done, total } = chapterCount(index, book, chapter);
  return done > 0 && total ? Math.min(1, done / total) : 0;
}

// A book's (or its chapters `from`..`to`'s) 0..1 share memorized. Chapter lengths come from cached
// verse numbers where it's been loaded here; otherwise the book's verse total is spread evenly.
export function bookMemorizedFraction(index: MemorizedVerseIndex, book: BibleBook, from = 1, to = book.chapterCount): number {
  const average = (BOOK_VERSE_COUNTS[book.name] ?? 0) / book.chapterCount;
  let done = 0;
  let total = 0;
  for (let chapter = from; chapter <= to; chapter++) {
    const { done: count, total: known } = chapterCount(index, book.name, chapter);
    const length = known ?? Math.max(average, count);
    done += Math.min(count, length);
    total += length;
  }
  return total > 0 ? Math.min(1, done / total) : 0;
}
