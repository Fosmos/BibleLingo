"use client";

import { useCallback, useState } from "react";
import type { SrsReviewRun } from "@/types";
import type { ReviewChainProgress } from "@/lib/useReviewChain";
import { useProgressStore } from "@/store/useProgressStore";

interface SrsReviewRunState {
  // Where the run starts: the saved range, when this is the run left part-way.
  startIndex: number;
  // The saved place inside range `index`, if the run stopped there (undefined: start it fresh).
  progressFor: (index: number) => ReviewChainProgress | undefined;
  // Saves the reader's place inside range `index` (see ReviewChain.tsx's onProgress).
  saveProgress: (index: number, progress: ReviewChainProgress) => void;
  // Moves the saved place on to range `index` — keeping the saved word position if already there.
  saveIndex: (index: number) => void;
  // The run is over (finished, or nothing left): nothing to pick up any more.
  finish: () => void;
}

const sameIds = (a: string[], b: string[]) => a.length === b.length && a.every((id, index) => id === b[index]);

// Saves the Mind Map's SRS review run as it goes (UserProgress.srsReviewRun), so leaving part-way
// lets the reader pick it up later where they stopped (MindMapReviewDueButton.tsx's "Continue").
// A run resumes when it's started over the same ranges as the saved one; any other start is fresh.
export function useSrsReviewRun(entityIds: string[]): SrsReviewRunState {
  const saveRun = useProgressStore((state) => state.saveSrsReviewRun);
  const [resume] = useState<SrsReviewRun | null>(() => {
    const saved = useProgressStore.getState().srsReviewRun;
    return saved && sameIds(saved.entityIds, entityIds) ? saved : null;
  });

  const saveProgress = useCallback((index: number, progress: ReviewChainProgress) => saveRun({ entityIds, index, ...progress }), [entityIds, saveRun]);
  const saveIndex = useCallback(
    (index: number) => {
      const saved = useProgressStore.getState().srsReviewRun;
      if (saved && sameIds(saved.entityIds, entityIds) && saved.index === index) return;
      saveRun({ entityIds, index, wordIndex: 0, wrongWordIndices: [] });
    },
    [entityIds, saveRun],
  );
  const finish = useCallback(() => saveRun(null), [saveRun]);

  return {
    startIndex: resume?.index ?? 0,
    progressFor: (index) => (resume && resume.index === index ? { wordIndex: resume.wordIndex, wrongWordIndices: resume.wrongWordIndices } : undefined),
    saveProgress,
    saveIndex,
    finish,
  };
}
