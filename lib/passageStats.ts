import type { MemorizedEntity, SrsReviewResult } from "@/types";
import { getChapterVerses } from "@/lib/chapterContent";
import { tokenizeVerseWords, stripPunctuation } from "@/lib/verseWords";
import { verseKey } from "@/lib/verseKey";

// A passage's past review results for its graph, oldest first — its stored history, or for one
// reviewed before history was kept, just its last result.
export function reviewHistory(entity: MemorizedEntity): SrsReviewResult[] {
  if (entity.srs.history?.length) return entity.srs.history;
  return entity.srs.lastAccuracy !== undefined && entity.srs.lastReviewedAt ? [{ at: entity.srs.lastReviewedAt, accuracy: entity.srs.lastAccuracy }] : [];
}

export interface AccuracySummary {
  last: number | null;
  best: number | null;
  average: number | null;
}

export function accuracySummary(history: SrsReviewResult[], best: number | undefined): AccuracySummary {
  if (!history.length) return { last: null, best: best ?? null, average: null };
  const average = Math.round(history.reduce((sum, result) => sum + result.accuracy, 0) / history.length);
  return { last: history[history.length - 1].accuracy, best: Math.max(best ?? 0, ...history.map((result) => result.accuracy)), average };
}

export interface TroubleWord {
  word: string;
  verseNumber: number;
  misses: number;
}

// The passage's most-missed words in review (UserProgress.wordStumbleCounts, per word of each
// verse), most first. Needs the chapter's text in the local cache to name the words — empty without it.
export function troubleWords(entity: MemorizedEntity, stumbles: Record<string, number[]>, limit = 5): TroubleWord[] {
  const verses = getChapterVerses(entity.book, entity.chapter);
  if (!verses) return [];
  const found: TroubleWord[] = [];
  for (let verseNumber = entity.startVerse; verseNumber <= entity.endVerse; verseNumber++) {
    const counts = stumbles[verseKey(entity.book, entity.chapter, verseNumber)];
    const words = tokenizeVerseWords(verses.find((verse) => verse.verseNumber === verseNumber)?.text ?? "");
    counts?.forEach((misses, index) => {
      if (misses > 0 && words[index]) found.push({ word: stripPunctuation(words[index]), verseNumber, misses });
    });
  }
  return found.sort((a, b) => b.misses - a.misses || a.verseNumber - b.verseNumber).slice(0, limit);
}
