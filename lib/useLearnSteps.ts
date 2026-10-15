"use client";

import { useMemo } from "react";
import { useProgressStore } from "@/store/useProgressStore";
import { buildSteps, type FlatStep } from "@/lib/learnSteps";

// Reads every per-reader Learn-stage toggle (Profile > Advanced) and builds this day's own
// flat step list from them — split out of LearnSection.tsx purely to keep that file under
// this codebase's 200-line cap.
export function useLearnSteps(realVerseIndices: number[]): FlatStep[] {
  const understandStageEnabled = useProgressStore((state) => state.understandStageEnabled);
  const visualizeStageEnabled = useProgressStore((state) => state.visualizeStageEnabled);
  const writeFirstLetterStageEnabled = useProgressStore((state) => state.writeFirstLetterStageEnabled);
  const fillInTheBlankStageEnabled = useProgressStore((state) => state.fillInTheBlankStageEnabled);
  // Listen defaults ON and Rhythm defaults OFF now — see their own doc comments on
  // UserProgress in types/index.ts for why the two swapped roles. Both `?? …` fallbacks are
  // this codebase's usual self-healing for a field added after some readers' progress was
  // already saved (see lib/useSessionCheckpoint.ts's own doc comment on the same pattern).
  const kineticTextStageEnabled = useProgressStore((state) => state.kineticTextStageEnabled) ?? true;
  const rhythmStageEnabled = useProgressStore((state) => state.rhythmStageEnabled) ?? false;

  return useMemo(
    () =>
      buildSteps(
        realVerseIndices,
        understandStageEnabled,
        visualizeStageEnabled,
        writeFirstLetterStageEnabled,
        fillInTheBlankStageEnabled,
        kineticTextStageEnabled,
        rhythmStageEnabled,
      ),
    [
      realVerseIndices,
      understandStageEnabled,
      visualizeStageEnabled,
      writeFirstLetterStageEnabled,
      fillInTheBlankStageEnabled,
      kineticTextStageEnabled,
      rhythmStageEnabled,
    ],
  );
}
