"use client";

import { useMemo } from "react";
import type { VerseSegment } from "@/types";
import { useProgressStore } from "@/store/useProgressStore";
import { buildSteps, type FlatStep } from "@/lib/learnSteps";
import { senseLineCount } from "@/lib/senseLineSlice";

// Reads the optional Learn-stage toggles (Profile > Advanced) and builds this day's own flat step
// list from them and each verse's sense lines — split out of LearnSection.tsx purely to keep that
// file under this codebase's 200-line cap.
export function useLearnSteps(realVerseIndices: number[], verses: VerseSegment[]): FlatStep[] {
  const understand = useProgressStore((state) => state.understandStageEnabled);
  const visualize = useProgressStore((state) => state.visualizeStageEnabled);
  const writeFirstLetter = useProgressStore((state) => state.writeFirstLetterStageEnabled);
  // `?? false`: self-healing for progress saved before this field existed.
  const rhythm = useProgressStore((state) => state.rhythmStageEnabled) ?? false;

  return useMemo(
    () => buildSteps(realVerseIndices, realVerseIndices.map((index) => senseLineCount(verses[index])), { understand, visualize, rhythm, writeFirstLetter }),
    [realVerseIndices, verses, understand, visualize, rhythm, writeFirstLetter],
  );
}
