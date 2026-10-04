import type { MemorizedEntity, ProblemVerseEntry } from "@/types";
import { parseVerseKey, verseKey } from "@/lib/verseKey";

// One verse in the Memorized page's "Where you stumble" list: how often its words have been
// missed across SRS reviews (UserProgress.wordStumbleCounts), its most-missed word, and whether
// it's currently flagged as a problem verse (needed a hint — UserProgress.problemVerses).
export interface StumbleSpot {
  key: string;
  book: string;
  chapter: number;
  verseNumber: number;
  version: string;
  misses: number;
  // Word index (tokenizeVerseWords) of the most-missed word; undefined with no misses tracked.
  worstWordIndex?: number;
  counts?: number[];
  flagged: boolean;
}

// A stumble-tracked verse's translation isn't stored with its miss counts — recovered from the
// memorized range covering it (KJV, the app's older-data default, when none still does).
function resolveVersion(entities: MemorizedEntity[], book: string, chapter: number, verseNumber: number): string {
  const match = entities.find(
    (entity) => entity.book === book && entity.chapter === chapter && verseNumber >= entity.startVerse && verseNumber <= entity.endVerse,
  );
  return match?.version ?? "KJV";
}

function worstIndex(counts: number[]): number | undefined {
  let best: number | undefined;
  counts.forEach((count, index) => {
    if (count > 0 && (best === undefined || count > counts[best])) best = index;
  });
  return best;
}

// Every verse with a missed word or a problem flag, worst first (flagged verses break ties).
export function buildStumbleSpots(
  wordStumbleCounts: Record<string, number[]>,
  problemVerses: Record<string, ProblemVerseEntry>,
  entities: MemorizedEntity[],
): StumbleSpot[] {
  const spots = new Map<string, StumbleSpot>();
  for (const [key, counts] of Object.entries(wordStumbleCounts)) {
    const misses = counts.reduce((sum, count) => sum + count, 0);
    if (misses === 0) continue;
    const { book, chapter, verseNumber } = parseVerseKey(key);
    const version = resolveVersion(entities, book, chapter, verseNumber);
    spots.set(key, { key, book, chapter, verseNumber, version, misses, counts, worstWordIndex: worstIndex(counts), flagged: false });
  }
  for (const entry of Object.values(problemVerses)) {
    const key = verseKey(entry.book, entry.chapter, entry.verseNumber);
    const existing = spots.get(key);
    if (existing) existing.flagged = true;
    else spots.set(key, { key, book: entry.book, chapter: entry.chapter, verseNumber: entry.verseNumber, version: entry.version, misses: 0, flagged: true });
  }
  return Array.from(spots.values()).sort((a, b) => b.misses - a.misses || Number(b.flagged) - Number(a.flagged));
}
