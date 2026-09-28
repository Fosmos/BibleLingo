import type { MindMapChapterDatum, MindMapPericopeDatum } from "@/lib/mindMapTypes";

// A chapter's own 0..1 fraction of its VERSES memorized, summed across its pericopes — the ring
// node's own progress-sweep source (see MindMapRingNode.tsx's `progress` prop). Counted in
// verses, not pericopes, so the ring moves with every lesson rather than only when a whole
// section closes. Derived at read time from the pericopes already in hand, not a stored
// percentage that could drift (see CLAUDE.md's "derived UI state" rule). 0 while nothing's
// loaded yet rather than NaN.
export function chapterVerseProgress(datum: MindMapChapterDatum): number {
  let total = 0;
  let done = 0;
  for (const pericope of datum.children) {
    const { rangeStartVerse, rangeEndVerse } = pericope;
    if (rangeStartVerse === undefined || rangeEndVerse === undefined || rangeEndVerse < rangeStartVerse) continue;
    const size = rangeEndVerse - rangeStartVerse + 1;
    total += size;
    done += pericopeVerseProgress(pericope) * size;
  }
  return total > 0 ? done / total : 0;
}

// A single pericope's own 0..1 fraction of its structural verse range actually reached —
// MindMapPericopeGateway.tsx's own progress-ring source. Reuses `learnedVerses`, the
// exact same finer-grained-than-`status` signal lib/mindMapPericopeSpine.ts already reads to
// decide which verse chips/spine segments render dashed vs. solid, so the plaque's own ring
// always agrees with what the spine underneath it already shows. 0 while the pericope's own
// range hasn't loaded yet or nothing's been reached, rather than NaN.
export function pericopeVerseProgress(datum: MindMapPericopeDatum): number {
  const { learnedVerses, rangeStartVerse, rangeEndVerse } = datum;
  if (!learnedVerses || rangeStartVerse === undefined || rangeEndVerse === undefined || rangeEndVerse < rangeStartVerse) {
    return 0;
  }
  const total = rangeEndVerse - rangeStartVerse + 1;
  const done = learnedVerses.filter((verse) => verse >= rangeStartVerse && verse <= rangeEndVerse).length;
  return Math.min(1, done / total);
}
