"use client";

import { useState } from "react";
import type { BibleBook } from "@/types";
import type { LearnIntensityStages } from "@/lib/learnIntensity";
import { useProgressStore } from "@/store/useProgressStore";

type GoToPath = (identifier: string, kind: "book" | "chapter" | "verse", version: string, versesPerDay?: number) => void;

interface UseLearnIntensityFlowArgs {
  mode: "book" | "chapter" | "verse";
  selectedBook: BibleBook | null;
  selectedChapter: number | null;
  selectedVersion: string | null;
  goToPath: GoToPath;
}

// Extracted out of GuidedPathFlow.tsx purely to keep that file under this codebase's 200-line
// cap. Holds the step chain that follows book/chapter mode's VersesPerDayPicker: pick verses
// per day -> pick a Learn intensity (applied as global stage toggles, see
// store/learnSettingsActions.ts — not per-path) -> finish the path. Memory Palace tag levels
// (which scopes get an "add location tag" option) are a global Settings toggle now (see
// components/gamification/MemoryPalaceTagLevelToggles.tsx), not asked here.
export function useLearnIntensityFlow({ mode, selectedBook, selectedChapter, selectedVersion, goToPath }: UseLearnIntensityFlowArgs) {
  const buildingViewEnabled = useProgressStore((state) => state.buildingViewEnabled);
  const setBuildingViewEnabled = useProgressStore((state) => state.setBuildingViewEnabled);
  const understandStageEnabled = useProgressStore((state) => state.understandStageEnabled);
  const setUnderstandStageEnabled = useProgressStore((state) => state.setUnderstandStageEnabled);
  const visualizeStageEnabled = useProgressStore((state) => state.visualizeStageEnabled);
  const setVisualizeStageEnabled = useProgressStore((state) => state.setVisualizeStageEnabled);
  const writeFirstLetterStageEnabled = useProgressStore((state) => state.writeFirstLetterStageEnabled);
  const setWriteFirstLetterStageEnabled = useProgressStore((state) => state.setWriteFirstLetterStageEnabled);
  const fillInTheBlankStageEnabled = useProgressStore((state) => state.fillInTheBlankStageEnabled);
  const setFillInTheBlankStageEnabled = useProgressStore((state) => state.setFillInTheBlankStageEnabled);

  // Held between steps so the final goToPath call has both answers at once.
  const [pendingVersesPerDay, setPendingVersesPerDay] = useState<number | null>(null);

  function handleSelectVersesPerDay(versesPerDay: number) {
    if (!selectedBook || !selectedVersion) return;
    setPendingVersesPerDay(versesPerDay);
  }

  function handleIntensityContinue(stages: LearnIntensityStages, memoryPalace: boolean) {
    setUnderstandStageEnabled(stages.understandStageEnabled);
    setVisualizeStageEnabled(stages.visualizeStageEnabled);
    setWriteFirstLetterStageEnabled(stages.writeFirstLetterStageEnabled);
    setFillInTheBlankStageEnabled(stages.fillInTheBlankStageEnabled);
    setBuildingViewEnabled(memoryPalace);
    if (!selectedBook || !selectedVersion || pendingVersesPerDay === null) return;
    if (mode === "chapter" && selectedChapter) {
      goToPath(`${selectedBook.name}|${selectedChapter}`, "chapter", selectedVersion, pendingVersesPerDay);
      return;
    }
    goToPath(selectedBook.name, "book", selectedVersion, pendingVersesPerDay);
  }

  return {
    pendingVersesPerDay,
    initialStages: { understandStageEnabled, visualizeStageEnabled, writeFirstLetterStageEnabled, fillInTheBlankStageEnabled },
    initialMemoryPalace: buildingViewEnabled,
    handleSelectVersesPerDay,
    handleIntensityContinue,
    resetPendingVersesPerDay: () => setPendingVersesPerDay(null),
  };
}
