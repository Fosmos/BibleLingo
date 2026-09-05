"use client";

import { useState } from "react";
import type { BibleBook, LocationTagLevel } from "@/types";
import type { LearnIntensityStages } from "@/lib/learnIntensity";
import { useProgressStore } from "@/store/useProgressStore";

type GoToPath = (
  identifier: string,
  kind: "book" | "chapter" | "verse",
  version: string,
  versesPerDay?: number,
  locationTagLevels?: LocationTagLevel[],
  sectionEndPegEnabled?: boolean,
) => void;

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
// store/learnSettingsActions.ts — not per-path) -> optionally pick Memory Palace tag levels
// (LocationTagLevelPicker) -> finish the path.
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
  const pegSystemEnabled = useProgressStore((state) => state.pegSystemEnabled);
  const setPegSystemEnabled = useProgressStore((state) => state.setPegSystemEnabled);

  // Held between steps so the final goToPath call has all three answers at once.
  const [pendingVersesPerDay, setPendingVersesPerDay] = useState<number | null>(null);
  const [showLocationTagLevels, setShowLocationTagLevels] = useState(false);

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
    if (memoryPalace) {
      setShowLocationTagLevels(true);
      return;
    }
    if (!selectedBook || !selectedVersion || pendingVersesPerDay === null) return;
    if (mode === "chapter" && selectedChapter) {
      goToPath(`${selectedBook.name}|${selectedChapter}`, "chapter", selectedVersion, pendingVersesPerDay);
      return;
    }
    goToPath(selectedBook.name, "book", selectedVersion, pendingVersesPerDay);
  }

  function handleSelectLocationTagLevels(levels: LocationTagLevel[], pegsEnabled: boolean, sectionEndPegEnabled: boolean) {
    setPegSystemEnabled(pegsEnabled);
    if (!selectedBook || !selectedVersion || pendingVersesPerDay === null) return;
    if (mode === "chapter" && selectedChapter) {
      goToPath(`${selectedBook.name}|${selectedChapter}`, "chapter", selectedVersion, pendingVersesPerDay, levels, sectionEndPegEnabled);
      return;
    }
    goToPath(selectedBook.name, "book", selectedVersion, pendingVersesPerDay, levels, sectionEndPegEnabled);
  }

  return {
    pendingVersesPerDay,
    showLocationTagLevels,
    initialStages: { understandStageEnabled, visualizeStageEnabled, writeFirstLetterStageEnabled, fillInTheBlankStageEnabled },
    initialMemoryPalace: buildingViewEnabled,
    initialPegSystemEnabled: pegSystemEnabled,
    handleSelectVersesPerDay,
    handleIntensityContinue,
    handleSelectLocationTagLevels,
    resetPendingVersesPerDay: () => setPendingVersesPerDay(null),
    resetShowLocationTagLevels: () => setShowLocationTagLevels(false),
  };
}
