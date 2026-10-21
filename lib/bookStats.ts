import type { MemorizedEntity, PathProgress } from "@/types";
import { findBook } from "@/lib/bibleBooks";
import { isDue } from "@/lib/srs";
import { verseCount } from "@/lib/memorizedLibrary";
import { firstMemorizedText } from "@/lib/memorizedDates";
import { bookMemorizedFraction, buildMemorizedVerseIndex } from "@/lib/memorizedVerseIndex";

// A book's info page totals (BookStatsScreen.tsx), over its memorized passages. Pure.
export interface BookStats {
  verses: number;
  passages: number;
  chapters: number;
  // 0–100 of the book's verses memorized (path progress included); null for an unknown book.
  percent: number | null;
  dueIds: string[];
  // The mean of each passage's last review score, and how many reviews it's had in all.
  averageAccuracy: number | null;
  reviews: number;
  firstMemorized: string | null;
}

export function bookStats(book: string, entities: MemorizedEntity[], paths: Record<string, PathProgress>, now: Date): BookStats {
  const mine = entities.filter((entity) => entity.book === book);
  const scored = mine.flatMap((entity) => (entity.srs.lastAccuracy === undefined ? [] : [entity.srs.lastAccuracy]));
  const meta = findBook(book);
  return {
    verses: mine.reduce((sum, entity) => sum + verseCount(entity), 0),
    passages: mine.length,
    chapters: new Set(mine.map((entity) => entity.chapter)).size,
    percent: meta ? Math.round(bookMemorizedFraction(buildMemorizedVerseIndex(paths, entities), meta) * 1000) / 10 : null,
    dueIds: mine.filter((entity) => isDue(entity.srs, now)).map((entity) => entity.id),
    averageAccuracy: scored.length ? Math.round(scored.reduce((sum, value) => sum + value, 0) / scored.length) : null,
    reviews: mine.reduce((sum, entity) => sum + (entity.srs.history?.length ?? (entity.srs.lastReviewedAt ? 1 : 0)), 0),
    firstMemorized: firstMemorizedText(mine),
  };
}
