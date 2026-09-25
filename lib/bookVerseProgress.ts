import type { BibleBook } from "@/types";
import type { BookTheme } from "@/lib/bookThemes";
import { bookMemorizedFraction, type MemorizedVerseIndex } from "@/lib/memorizedVerseIndex";

// The Mind Map's Book/Theme/Testament/Genre ring percentages — each a share of VERSES memorized
// (see lib/memorizedVerseIndex.ts), so a long chapter weighs more than a short one and partial
// chapters still move the ring, counted from all of the reader's progress rather than any one path.

export function bookCompletionPercent(index: MemorizedVerseIndex, book: BibleBook): number {
  return Math.round(bookMemorizedFraction(index, book) * 100);
}

// A theme's own slice of its book's verses — scoped to the theme's startChapter..endChapter.
export function themeCompletionPercent(index: MemorizedVerseIndex, book: BibleBook, theme: BookTheme): number {
  return Math.round(bookMemorizedFraction(index, book, theme.startChapter, theme.endChapter) * 100);
}

// Chapter-weighted average across any group of books — Testament, Genre and Subgenre nodes.
// Chapters stand in for size, since verse totals of books never opened aren't all cached.
export function groupCompletionPercent(index: MemorizedVerseIndex, books: BibleBook[]): number {
  let totalChapters = 0;
  let weighted = 0;
  for (const book of books) {
    totalChapters += book.chapterCount;
    weighted += bookMemorizedFraction(index, book) * book.chapterCount;
  }
  return totalChapters > 0 ? Math.round((weighted / totalChapters) * 100) : 0;
}
