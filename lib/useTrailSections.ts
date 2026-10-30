"use client";

import { useMemo } from "react";
import type { MemorizationDay, PathKind } from "@/types";
import { useProgressStore } from "@/store/useProgressStore";
import { buildSteps } from "@/lib/learnSteps";
import { STAGE_LABELS } from "@/lib/learnSheetStage";
import { buildTrail } from "@/lib/trailStops";

// A path's trail, from the reader's progress and lesson settings — the Path and Quest tabs' sections.
export function useTrailSections(pathKey: string, kind: PathKind, days: MemorizationDay[], completedDays: number, versesIntoDay = 0) {
  const entities = useProgressStore((state) => state.memorizedEntities);
  const reviewsDone = useProgressStore((state) => state.paths[pathKey]?.reviewsDone);
  const toggles = useProgressStore((state) => state);
  // A verse path's trail is its one lesson's learning stages, in the order the reader has them on.
  const stageLabels = useMemo(() => {
    const steps = buildSteps([0], [1], {
      understand: toggles.understandStageEnabled,
      visualize: toggles.visualizeStageEnabled,
      rhythm: toggles.rhythmStageEnabled ?? false,
      writeFirstLetter: toggles.writeFirstLetterStageEnabled,
      pray: toggles.prayStageEnabled ?? false,
      lastLetters: toggles.lastLettersStageEnabled ?? true,
      timedType: toggles.timedTypeStageEnabled ?? true,
      payload: toggles.payloadStageEnabled ?? true,
      mathBreaks: toggles.mathBreakStageEnabled ?? true,
      wholeVerse: toggles.wholeVerseLearning,
      sayLadder: toggles.sayLadderLearning ?? true,
    });
    return [...new Set(steps.filter((step) => step.phase !== "pray").map((step) => STAGE_LABELS[step.phase]))];
  }, [toggles.understandStageEnabled, toggles.visualizeStageEnabled, toggles.writeFirstLetterStageEnabled, toggles.rhythmStageEnabled, toggles.prayStageEnabled, toggles.lastLettersStageEnabled, toggles.timedTypeStageEnabled, toggles.payloadStageEnabled, toggles.mathBreakStageEnabled, toggles.wholeVerseLearning, toggles.sayLadderLearning]);
  return useMemo(() => buildTrail(kind, days, completedDays, entities, stageLabels, versesIntoDay, reviewsDone), [kind, days, completedDays, entities, stageLabels, versesIntoDay, reviewsDone]);
}
