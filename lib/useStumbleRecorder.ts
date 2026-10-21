"use client";

import { useCallback, useRef } from "react";
import type { VerseSegment } from "@/types";
import { useProgressStore } from "@/store/useProgressStore";
import { chainStumbles } from "@/lib/stumbleTracking";
import { wholeVerseWord } from "@/lib/stumbleRecorder";
import { isReferenceToken, tokenizeVerseWords } from "@/lib/verseWords";

// A Learn drill's missed words, counted into UserProgress.wordStumbleCounts as they happen — the
// same per-word counts spaced review keeps, so the stats can show where the reader struggles while
// memorizing as well as reviewing. Each word counts once per verse shown (a second wrong key on it
// is the same struggle). Like usePeekedVerses, the one store hook a drill reaches for itself.
export function useStumbleRecorder(verse: VerseSegment | undefined): (index: number) => void {
  const recordWordStumbles = useProgressStore((state) => state.recordWordStumbles);
  const counted = useRef<{ id: string; indices: Set<number> }>({ id: "", indices: new Set() });
  return useCallback(
    (index: number) => {
      if (!verse) return;
      if (counted.current.id !== verse.id) counted.current = { id: verse.id, indices: new Set() };
      if (counted.current.indices.has(index)) return;
      counted.current.indices.add(index);
      const word = wholeVerseWord(verse, index);
      if (word) recordWordStumbles(word.verse, [word.index]);
    },
    [verse, recordWordStumbles],
  );
}

// A review chain's missed words (positions across all its verses — lib/useReviewChain.ts), counted
// per verse once the chain is done (ReviewChain.tsx).
export function useChainStumbleRecorder(): (verses: VerseSegment[], wrongIndices: number[]) => void {
  const recordWordStumbles = useProgressStore((state) => state.recordWordStumbles);
  return useCallback(
    (verses: VerseSegment[], wrongIndices: number[]) => {
      for (const { verse, indices } of chainStumbles(verses, wrongIndices)) {
        // chainStumbles' positions already skip a verse-number first word; counted against the verse without it.
        const words = tokenizeVerseWords(verse.text);
        recordWordStumbles({ ...verse, text: words.slice(isReferenceToken(words[0] ?? "") ? 1 : 0).join(" ") }, indices);
      }
    },
    [recordWordStumbles],
  );
}
