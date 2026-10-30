import type { VerseSegment } from "@/types";

// A normal lesson reviews the last few verses, the new one included.
const WINDOW = 5;
// Every so many verses, it reviews the block so far instead.
const BLOCK_EVERY = 5;
// A chapter up to this long is one block; a longer one splits into blocks of about BLOCK_SIZE verses.
const LONG_CHAPTER = 40;
const BLOCK_SIZE = 20;
// How far from BLOCK_SIZE a pericope's start may be and still end a block.
const BLOCK_SLACK = 10;

// The first verses of a chapter's blocks — [1] for a chapter of up to 40 verses. A longer one breaks
// at the pericope start closest to 20 verses on, or at 20 if none is near; the last block takes
// whatever's left rather than leaving a short one.
export function reviewBlockStarts(chapterLength: number, pericopeStarts: number[]): number[] {
  const starts = [1];
  if (chapterLength <= LONG_CHAPTER) return starts;
  let start = 1;
  while (chapterLength - start + 1 > BLOCK_SIZE + BLOCK_SLACK) {
    const target = start + BLOCK_SIZE;
    const near = pericopeStarts.filter((verse) => Math.abs(verse - target) <= BLOCK_SLACK && chapterLength - verse + 1 >= BLOCK_SLACK);
    start = near.sort((a, b) => Math.abs(a - target) - Math.abs(b - target))[0] ?? target;
    starts.push(start);
  }
  return starts;
}

// What a lesson's closing review covers, from `prior` (the learned verses before the lesson, back
// through its chapter — lib/usePriorLearnedVerse.ts) and its own `learned` verses: the last five
// verses, or on every fifth verse the whole block so far (the chapter so far, in a chapter of up to 40).
export function lessonReviewVerses(prior: VerseSegment[], learned: VerseSegment[], chapterLength: number, pericopeStarts: number[]): VerseSegment[] {
  const last = learned[learned.length - 1];
  if (!last) return prior;
  if (!learned.some((verse) => verse.verseNumber % BLOCK_EVERY === 0)) return [...prior.slice(-WINDOW), ...learned].slice(-Math.max(WINDOW, learned.length));
  const blockStart = reviewBlockStarts(chapterLength, pericopeStarts).filter((start) => start <= last.verseNumber).at(-1) ?? 1;
  // Never less than the window, just after a new block starts — that keeps the join between blocks.
  const from = Math.min(blockStart, last.verseNumber - WINDOW + 1);
  return [...prior.filter((verse) => verse.verseNumber >= from), ...learned];
}
