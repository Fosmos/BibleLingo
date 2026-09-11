import type { VerseSegment } from "@/types";

// Book+chapter together, not chapter alone — a bare chapter NUMBER means nothing on its own
// across books (Genesis 1 and John 1 are both "chapter 1"), which matters for topic-mode
// paths: those curate verses from unrelated books/chapters, not a contiguous passage.
function chapterKey(verse: VerseSegment): string {
  return `${verse.book}|${verse.chapter}`;
}

// Chunks `verses` into `size`-sized lessons using the SAME fixed global stepping a plain
// `verses.slice(i, i + size)` loop would (i, i+size, i+2*size, ...) — but a lesson never
// spans two chapters: wherever a chapter boundary falls inside one of those fixed-size
// slices, that slice is split there into two (or more) shorter pieces instead. A lesson can
// freely span multiple pericopes within the same chapter now (a lesson always gets the full
// `size` requested, pericope boundaries aside) — book mode's own chapter-by-chapter display
// grouping (MemorizationDay.chapterGroup) is what actually needs the chapter boundary to
// hold, not any pericope one. The stepping itself is never adjusted to compensate for an
// earlier split — a chapter's own leftover verses become their own short lesson, and the
// next lesson afterward still starts exactly where the original, un-split stepping would
// have put it, back at the requested size (unless IT also happens to straddle a boundary).
export function chunkVersesRespectingChapters(verses: VerseSegment[], size: number): VerseSegment[][] {
  const chunks: VerseSegment[][] = [];

  for (let i = 0; i < verses.length; i += size) {
    const originalSlice = verses.slice(i, i + size);
    let piece: VerseSegment[] = [];
    let pieceKey: string | null = null;

    for (const verse of originalSlice) {
      const key = chapterKey(verse);
      const crossesBoundary = piece.length > 0 && pieceKey !== null && key !== pieceKey;
      if (crossesBoundary) {
        chunks.push(piece);
        piece = [];
      }
      if (piece.length === 0) pieceKey = key;
      piece.push(verse);
    }
    if (piece.length > 0) chunks.push(piece);
  }

  return chunks;
}
