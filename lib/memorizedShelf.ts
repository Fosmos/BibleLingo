import type { MemorizedEntity, VerseSegment } from "@/types";
import type { PericopeInfo } from "@/lib/chapterPericopes";
import { chapterLength } from "@/lib/bibleProgress";
import { isDue } from "@/lib/srs";
import { sealTier } from "@/lib/srsSeals";
import type { TrailSection, TrailStop } from "@/lib/trailStops";
import { buildRingBook, reviewAge, type RingChapter } from "@/lib/verseRings";

// The Memorized tab's books: the links between its screens, and its chapters in the same boxes as
// the Palace tab (lib/verseRings.ts), built from the spaced-review ranges rather than a path.
// A row in the Memorized tab's list of tools.
export const TOOL_ROW = "flex min-h-[52px] w-full items-center justify-between border-b border-sand-200 text-left text-[15px] font-extrabold text-ink disabled:opacity-40 dark:border-zinc-900 dark:text-zinc-100";

export const shelfHref = (book: string, chapter?: number) => `/memorized?book=${encodeURIComponent(book)}${chapter === undefined ? "" : `&chapter=${chapter}`}`;

// A book's chapters by number: blank until something in them is memorized.
export function shelfChapters(book: string, chapterCount: number, entities: MemorizedEntity[], now: Date): RingChapter[] {
  return Array.from({ length: chapterCount }, (_, at): RingChapter => {
    const chapter = at + 1;
    const ranges = entities.filter((entity) => entity.book === book && entity.chapter === chapter);
    const known = ranges.reduce((sum, entity) => sum + entity.endVerse - entity.startVerse + 1, 0);
    const { total, exact } = chapterLength(book, chapter);
    return {
      chapter,
      book,
      passages: [],
      known,
      total: 0,
      hasToday: false,
      hasNext: false,
      age: ranges.length ? Math.max(...ranges.map((entity) => reviewAge(entity.srs, now))) : undefined,
      seal: exact && known >= total ? sealTier(entities, { book, chapter }) : null,
    };
  });
}

function stopFor(verse: VerseSegment, entity: MemorizedEntity | undefined, now: Date): TrailStop {
  return {
    key: verse.id,
    dayNumber: 0,
    label: `${verse.chapter}:${verse.verseNumber}`,
    title: verse.reference,
    state: entity ? "done" : "locked",
    checkpoint: false,
    dueIds: entity && isDue(entity.srs, now) ? [entity.id] : [],
    verses: [verse],
    verse,
  };
}

// A chapter's verses under its pericopes, or as one group when it has no headings.
export function shelfChapter(verses: VerseSegment[], pericopes: PericopeInfo[], entities: MemorizedEntity[], stumbles: Record<string, number[]>, now: Date): RingChapter | undefined {
  const first = verses[0];
  const last = verses[verses.length - 1];
  if (!first || !last) return undefined;
  const groups = pericopes.length ? pericopes.map(({ heading, startVerse, endVerse }) => ({ heading, startVerse, endVerse })) : [{ heading: `Verses ${first.verseNumber}–${last.verseNumber}`, startVerse: first.verseNumber, endVerse: last.verseNumber }];
  const passages = groups.flatMap(({ heading, startVerse, endVerse }) => {
    const lessons = verses
      .filter((verse) => verse.verseNumber >= startVerse && verse.verseNumber <= endVerse)
      .map((verse) => stopFor(verse, entities.find((entity) => entity.book === verse.book && entity.chapter === verse.chapter && entity.startVerse <= verse.verseNumber && entity.endVerse >= verse.verseNumber), now));
    if (!lessons.length) return [];
    const section: TrailSection = { ref: `${first.book} ${first.chapter}:${startVerse}–${endVerse}`, kicker: "", title: heading, stops: lessons, state: "complete", done: 0 };
    return [{ section, lessons }];
  });
  return buildRingBook(passages, entities, stumbles, now).chapters[0];
}
