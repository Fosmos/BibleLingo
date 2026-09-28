import type { MemorizationDay } from "@/types";
import { findVerseLessonDay } from "@/lib/verseLessonAction";
import type { LessonRange } from "@/lib/srsReviewOffer";

// The verses of the lesson that taught `book` `chapter`:`verseNumber`, among a path's `days` —
// undefined when none of them did (another book's path, or a verse added by hand).
export function lessonRangeOf(days: MemorizationDay[], book: string, chapter: number, verseNumber: number): LessonRange | undefined {
  const day = findVerseLessonDay(days, chapter, verseNumber);
  const verses = day?.newVerses.filter((verse) => verse.book === book && verse.chapter === chapter) ?? [];
  if (verses.length === 0) return undefined;
  return { startVerse: verses[0].verseNumber, endVerse: verses[verses.length - 1].verseNumber };
}
