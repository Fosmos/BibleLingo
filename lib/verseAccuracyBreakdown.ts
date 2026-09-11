// A review's accuracy is normally reported as one number for the whole (possibly multi-verse)
// segment being drilled — this instead breaks that same wrongWordIndices data down per
// individual verse, using the same word-index verse boundaries (lib/verseBatching.ts's
// verseNumberMarkers) every multi-verse drill already threads through for its inline verse
// numbers. Used by SRS review to flag an individual weak verse into the Problem Verses bin
// even when the group's overall accuracy is fine (see lib/problemVerses.ts).
export interface VerseAccuracy {
  verseNumber: number;
  accuracy: number;
  // Raw counts behind `accuracy` (already rounded) — lets a caller spanning several separate
  // FirstLetterTypeRep passes (see SrsEntityRecall.tsx's per-pericope segments) sum exact
  // word counts across all of them for one overall entity accuracy, instead of re-averaging
  // already-rounded percentages.
  wrongCount: number;
  totalWords: number;
  // Which word positions were wrong, local to THIS verse's own word list (0 = its first word)
  // rather than the combined multi-verse index wrongWordIndices itself uses — see
  // lib/stumbleTracking.ts's recordStumbles, the one consumer that needs to know exactly
  // which words, not just how many.
  wrongIndices: number[];
  // True wherever this verse has at least one word the reader had to explicitly ask for (SRS
  // review's own "Peek hint"/reveal-letter escape valve — see lib/useFirstLetterTyping.ts's
  // own peekHint, lib/useFirstLetterSpeaking.ts's own peeked count), as opposed to a word just
  // typed or spoken wrong. SrsReviewSession.tsx gates Problem Verses flagging on THIS, not on
  // `accuracy` — a verse recalled correctly on the first attempt but hit the wrong key once
  // shouldn't land in the bin the same way one the reader genuinely couldn't recall at all does.
  neededHint: boolean;
}

export function computeVerseAccuracies(
  words: string[],
  verseMarkers: Record<number, number> | undefined,
  firstVerseNumber: number,
  wrongWordIndices: Set<number>,
  hintedWordIndices?: Set<number>,
): VerseAccuracy[] {
  if (words.length === 0) return [];

  const breakpoints = [
    { index: 0, verseNumber: firstVerseNumber },
    ...Object.entries(verseMarkers ?? {})
      .map(([indexKey, verseNumber]) => ({ index: Number(indexKey), verseNumber }))
      .sort((a, b) => a.index - b.index),
  ];

  return breakpoints.map((breakpoint, position) => {
    const end = position + 1 < breakpoints.length ? breakpoints[position + 1].index : words.length;
    const rangeLength = end - breakpoint.index;
    if (rangeLength <= 0) {
      return { verseNumber: breakpoint.verseNumber, accuracy: 100, wrongCount: 0, totalWords: 0, wrongIndices: [], neededHint: false };
    }
    const wrongIndices: number[] = [];
    let neededHint = false;
    for (let index = breakpoint.index; index < end; index++) {
      if (wrongWordIndices.has(index)) wrongIndices.push(index - breakpoint.index);
      if (hintedWordIndices?.has(index)) neededHint = true;
    }
    return {
      verseNumber: breakpoint.verseNumber,
      accuracy: Math.round(((rangeLength - wrongIndices.length) / rangeLength) * 100),
      wrongCount: wrongIndices.length,
      totalWords: rangeLength,
      wrongIndices,
      neededHint,
    };
  });
}
