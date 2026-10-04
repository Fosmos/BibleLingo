import type { VerseSegment } from "@/types";

// Which verse numbers each chapter has — no text, just the numbers (minus a translation's gap
// verses, which have no text). Kept on the device for good, unlike the verse text itself: the
// ESV's license caps how much text can be stored (half a book at most — see
// lib/bibleApiClient.ts), so a whole memorized book's text is never all cached at once, but the
// Memorized page still needs to know every chapter's length to tell whether it's fully
// memorized (lib/progressSummary.ts).

const STORAGE_KEY = "verses:chapterVerseIndex:v1";

type ChapterVerseIndex = Record<string, number[]>;

const indexKey = (book: string, chapter: number) => `${book}|${chapter}`;

function readIndex(): ChapterVerseIndex {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}") as ChapterVerseIndex;
  } catch {
    return {};
  }
}

export function recordChapterVerses(book: string, chapter: number, verses: VerseSegment[]): void {
  if (typeof window === "undefined" || verses.length === 0) return;
  const numbers = verses.filter((verse) => verse.text.trim().length > 0).map((verse) => verse.verseNumber);
  const index = readIndex();
  const key = indexKey(book, chapter);
  if (index[key]?.length === numbers.length) return;
  index[key] = numbers;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(index));
  } catch {
    // Storage full — the Memorized page just undercounts until there's room.
  }
}

// The chapter's verse numbers, or undefined if it's never been loaded on this device.
export function getChapterVerseNumbers(book: string, chapter: number): number[] | undefined {
  return readIndex()[indexKey(book, chapter)];
}
