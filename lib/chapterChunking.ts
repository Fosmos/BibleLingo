import type { VerseSegment } from "@/types";

// Book+chapter together, not chapter alone — a bare chapter NUMBER means nothing on its own
// across books (Genesis 1 and John 1 are both "chapter 1"), which matters for topic-mode
// paths: those curate verses from unrelated books/chapters, not a contiguous passage.
function chapterKey(verse: VerseSegment): string {
  return `${verse.book}|${verse.chapter}`;
}

// Chunks `verses` into `size`-sized lessons — a lesson never spans two chapters (wherever a
// chapter boundary falls, the chunk ends there instead, short of `size`), and never spans a
// translation's own gap verse either counting toward it: some providers hand back a verse
// with genuinely empty text for a passage they omit entirely (see lib/bibleProviders/esv.ts's
// own note on Mark 7:16/9:44/9:46/11:26/15:28) — there's nothing there to actually learn, so
// it rides along in whichever chunk it structurally falls into (a reader still sees its own
// verse number in the reading view) without using up one of that chunk's `size` real verses.
// A lesson can freely span multiple pericopes within the same chapter now (a lesson always
// gets the full `size` REAL verses requested, pericope boundaries aside) — book mode's own
// chapter-by-chapter display grouping (MemorizationDay.chapterGroup) is what actually needs
// the chapter boundary to hold, not any pericope one.
export function chunkVersesRespectingChapters(verses: VerseSegment[], size: number): VerseSegment[][] {
  const chunks: VerseSegment[][] = [];
  let index = 0;

  while (index < verses.length) {
    const piece: VerseSegment[] = [];
    const pieceKey = chapterKey(verses[index]);
    let realCount = 0;

    while (index < verses.length && realCount < size && chapterKey(verses[index]) === pieceKey) {
      const verse = verses[index];
      piece.push(verse);
      if (verse.text.trim().length > 0) realCount += 1;
      index += 1;
    }

    chunks.push(piece);
  }

  return chunks;
}
