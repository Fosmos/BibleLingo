import type { MemorizedEntity, PathProgress } from "@/types";
import { findBook } from "@/lib/bibleBooks";
import { isDue } from "@/lib/srs";
import { verseCount } from "@/lib/memorizedLibrary";
import { firstMemorizedText } from "@/lib/memorizedDates";
import { bookMemorizedCounts, buildMemorizedVerseIndex } from "@/lib/memorizedVerseIndex";

// A book's info page totals (BookStatsScreen.tsx), over its memorized passages. Pure.
export interface BookStats {
  verses: number;
  passages: number;
  chapters: number;
  // 0–100 of the book's verses memorized, and how many of how many (path progress included) — null
  // for an unknown book.
  percent: number | null;
  bookVerses: { done: number; total: number } | null;
  dueIds: string[];
  // The mean of each passage's last review score.
  averageAccuracy: number | null;
  firstMemorized: string | null;
}

export function bookStats(book: string, entities: MemorizedEntity[], paths: Record<string, PathProgress>, now: Date): BookStats {
  const mine = entities.filter((entity) => entity.book === book);
  const scored = mine.flatMap((entity) => (entity.srs.lastAccuracy === undefined ? [] : [entity.srs.lastAccuracy]));
  const meta = findBook(book);
  const counts = meta ? bookMemorizedCounts(buildMemorizedVerseIndex(paths, entities), meta) : null;
  return {
    verses: mine.reduce((sum, entity) => sum + verseCount(entity), 0),
    passages: mine.length,
    chapters: new Set(mine.map((entity) => entity.chapter)).size,
    percent: counts && counts.total ? Math.floor(Math.min(1, counts.done / counts.total) * 1000) / 10 : null,
    bookVerses: counts,
    dueIds: mine.filter((entity) => isDue(entity.srs, now)).map((entity) => entity.id),
    averageAccuracy: scored.length ? Math.round(scored.reduce((sum, value) => sum + value, 0) / scored.length) : null,
    firstMemorized: firstMemorizedText(mine),
  };
}
