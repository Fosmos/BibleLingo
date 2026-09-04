import type { VerseSegment } from "@/types";
import { formatVerseRangeLabel } from "@/lib/chapterContent";
import { tokenizeVerseWords } from "@/lib/verseWords";

// Joins several verses into one synthetic VerseSegment for a stage that drills them
// together — text concatenated with spaces, reference/chapter/verseNumber taken from the
// first verse (the anchor shown in the stage header; the pericope header above it already
// carries the full range).
export function joinVerses(verses: VerseSegment[], idSuffix: string): VerseSegment {
  const first = verses[0];
  return {
    id: `${first.id}-${idSuffix}`,
    reference: formatVerseRangeLabel(verses),
    text: verses.map((verse) => verse.text).join(" "),
    book: first.book,
    chapter: first.chapter,
    verseNumber: first.verseNumber,
  };
}

// For a joined multi-verse segment, which word index each verse after the first starts at
// (e.g. Mark 5:12-15 -> {wordIndexOf13: 13, wordIndexOf14: 14, wordIndexOf15: 15}) — a
// purely presentational marker inserted between words at render time (see
// VerseNumberMarker.tsx), not a token in the text itself, so it's never something a drill
// asks the user to type or draw.
export function verseNumberMarkers(verses: VerseSegment[]): Record<number, number> {
  const markers: Record<number, number> = {};
  let offset = 0;
  verses.forEach((verse, index) => {
    if (index > 0) markers[offset] = verse.verseNumber;
    offset += tokenizeVerseWords(verse.text).length;
  });
  return markers;
}

// Given verseNumberMarkers and a word index, which verse number covers that word — the
// latest marker at or before wordIndex wins, falling back to the segment's own first verse
// number before any marker is reached. Used wherever a multi-verse segment's current verse
// needs to track where the reader has actually gotten to (e.g. FirstLetterTypeRep's header).
export function verseNumberAtWordIndex(
  verseMarkers: Record<number, number> | undefined,
  wordIndex: number,
  firstVerseNumber: number,
): number {
  let result = firstVerseNumber;
  let bestMarkerIndex = -1;
  for (const [markerIndexKey, markerVerseNumber] of Object.entries(verseMarkers ?? {})) {
    const markerIndex = Number(markerIndexKey);
    if (markerIndex <= wordIndex && markerIndex > bestMarkerIndex) {
      bestMarkerIndex = markerIndex;
      result = markerVerseNumber;
    }
  }
  return result;
}
