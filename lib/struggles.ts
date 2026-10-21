import type { MemorizedEntity } from "@/types";
import { getChapterVerses } from "@/lib/chapterContent";
import { parseVerseKey } from "@/lib/verseKey";
import { stripPunctuation, tokenizeVerseWords } from "@/lib/verseWords";

// The verses the reader struggles with most — from UserProgress.wordStumbleCounts, the words missed
// while memorizing (Learn drills) and reviewing alike (lib/useStumbleRecorder.ts). Pure.
export interface StruggleVerse {
  key: string;
  book: string;
  chapter: number;
  verseNumber: number;
  // Every miss on the verse, and on its first word — getting a verse started is its own struggle.
  misses: number;
  firstWordMisses: number;
  // Its most-missed word (or, ranked by first word, its first word) — when its text is cached here.
  word?: string;
  wordMisses: number;
  // The memorized passage holding it, for its stats page — unset for one still being learned.
  entityId?: string;
}

export type StruggleRanking = "verses" | "firstWords";

function struggleFor(key: string, counts: number[], entities: MemorizedEntity[], ranking: StruggleRanking): StruggleVerse {
  const { book, chapter, verseNumber } = parseVerseKey(key);
  const worst = ranking === "firstWords" ? 0 : counts.reduce((best, count, index) => (count > counts[best] ? index : best), 0);
  const text = getChapterVerses(book, chapter)?.find((verse) => verse.verseNumber === verseNumber)?.text;
  const word = text ? tokenizeVerseWords(text)[worst] : undefined;
  const entity = entities.find((candidate) => candidate.book === book && candidate.chapter === chapter && verseNumber >= candidate.startVerse && verseNumber <= candidate.endVerse);
  return {
    key,
    book,
    chapter,
    verseNumber,
    misses: counts.reduce((sum, count) => sum + count, 0),
    firstWordMisses: counts[0] ?? 0,
    word: word ? stripPunctuation(word) : undefined,
    wordMisses: counts[worst] ?? 0,
    entityId: entity?.id,
  };
}

// The top `limit` verses by misses — all of them, or by their first word — in one book or everywhere.
export function topStruggles(stumbles: Record<string, number[]>, entities: MemorizedEntity[], ranking: StruggleRanking, book?: string, limit = 3): StruggleVerse[] {
  return Object.entries(stumbles)
    .filter(([key, counts]) => (ranking === "firstWords" ? (counts[0] ?? 0) > 0 : counts.some((count) => count > 0)) && (!book || parseVerseKey(key).book === book))
    .map(([key, counts]) => struggleFor(key, counts, entities, ranking))
    .sort((a, b) => (ranking === "firstWords" ? b.firstWordMisses - a.firstWordMisses : 0) || b.misses - a.misses)
    .slice(0, limit);
}
