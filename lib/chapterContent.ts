import type { VerseSegment } from "@/types";
import { findBook } from "@/lib/bibleBooks";
import { getCachedChapter } from "@/lib/bibleContentCache";

export function chapterKey(book: string, chapter: number): string {
  return `${book}|${chapter}`;
}

export function parseChapterKey(key: string): { book: string; chapter: number } {
  const [book, chapter] = key.split("|");
  return { book, chapter: Number(chapter) };
}

export function formatChapterLabel(book: string, chapter: number): string {
  const displayBook = book === "Psalms" ? "Psalm" : book;
  return `${displayBook} ${chapter}`;
}

export function buildVerseSegments(book: string, chapter: number, verses: string[]): VerseSegment[] {
  const slug = book.toLowerCase().replace(/\s+/g, "-");
  const label = formatChapterLabel(book, chapter);
  return verses.map((text, index) => {
    const verseNumber = index + 1;
    return {
      id: `${slug}-${chapter}-${verseNumber}`,
      reference: `${label}:${verseNumber}`,
      text,
      book,
      chapter,
      verseNumber,
    };
  });
}

// Labels a book+chapter+verse-range for display, e.g. "Genesis 1:1-5" or "Genesis 1:3"
// when start and end are the same verse. Used for SRS-tracked MemorizedEntity ranges,
// which store book/chapter/startVerse/endVerse rather than a VerseSegment[].
export function formatVerseSpanLabel(book: string, chapter: number, startVerse: number, endVerse: number): string {
  const label = formatChapterLabel(book, chapter);
  return startVerse === endVerse ? `${label}:${startVerse}` : `${label}:${startVerse}-${endVerse}`;
}

// Labels a contiguous run of verses for display, e.g. "Genesis 1:1-5" when they share a
// chapter, or "Genesis 1:28–Genesis 2:3" when a book-mode chunk crosses a chapter boundary.
export function formatVerseRangeLabel(verses: VerseSegment[]): string {
  if (verses.length === 0) return "";
  const first = verses[0];
  const last = verses[verses.length - 1];
  if (verses.length === 1) return first.reference;
  if (first.chapter === last.chapter) {
    return `${formatChapterLabel(first.book, first.chapter)}:${first.verseNumber}-${last.verseNumber}`;
  }
  return `${first.reference}–${last.reference}`;
}

// Optionally prefixes each verse's text with its "chapter:verse " reference, e.g.
// "1:1 Paul and Timotheus..." — applied once wherever a path's verses are resolved for
// a lesson, so every drill downstream (they all just read verse.text) picks it up with
// no changes of their own.
export function applyReferencePreference(verses: VerseSegment[], includeReferences: boolean): VerseSegment[] {
  if (!includeReferences) return verses;
  return verses.map((verse) => ({ ...verse, text: `${verse.chapter}:${verse.verseNumber} ${verse.text}` }));
}

// Chapter text now comes from api.bible, fetched on demand when a path is chosen
// (see lib/bibleApiClient.ts) and cached in lib/bibleContentCache.ts. This is a pure
// cache read — it returns undefined until that fetch has completed at least once.
export function getChapterVerses(book: string, chapter: number): VerseSegment[] | undefined {
  return getCachedChapter(book, chapter);
}

// Looks up the verse immediately before (direction -1) or after (direction 1) the given
// one, crossing into the neighboring chapter when the given verse is the first/last in its
// own chapter — e.g. the verse after Mark 8:38 is Mark 9:1, not "no next verse." A
// same-chapter-only lookup would silently drop context right at that seam, which a
// multi-verse Learn day's chunk can end on or cross whenever a chapter boundary doesn't
// happen to line up with versesPerDay. Both chapters must already be cached (a book/verse
// path's own chapter always is by the time this runs; the neighboring chapter may not be,
// in which case this just returns undefined the same way an uncached chapter already does).
export function getAdjacentVerse(
  book: string,
  chapter: number,
  verseNumber: number,
  direction: 1 | -1,
): VerseSegment | undefined {
  const sameChapter = getChapterVerses(book, chapter)?.find((entry) => entry.verseNumber === verseNumber + direction);
  if (sameChapter) return sameChapter;
  const neighborChapter = chapter + direction;
  if (neighborChapter < 1) return undefined;
  const neighborVerses = getChapterVerses(book, neighborChapter);
  if (!neighborVerses || neighborVerses.length === 0) return undefined;
  return direction === 1 ? neighborVerses[0] : neighborVerses[neighborVerses.length - 1];
}

// Every chapter of every known book is selectable — content is fetched on demand
// rather than pre-authored, so availability is just "is this a real chapter number."
export function availableChaptersForBook(book: string): Set<number> {
  const chapterCount = findBook(book)?.chapterCount ?? 0;
  return new Set(Array.from({ length: chapterCount }, (_, index) => index + 1));
}
