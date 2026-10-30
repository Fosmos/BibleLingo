"use client";

import { useMemo } from "react";
import type { VerseSegment } from "@/types";
import { useProgressStore } from "@/store/useProgressStore";
import { buildSteps, type FlatStep } from "@/lib/learnSteps";
import { senseLineCount } from "@/lib/senseLineSlice";
import { findPlacement, palaceToPlaceIn } from "@/lib/palacePlacement";

// Reads the optional Learn-stage toggles (Profile > Advanced) and builds this day's own flat step
// list from them and each verse's sense lines — split out of LearnSection.tsx purely to keep that
// file under this codebase's 200-line cap.
export function useLearnSteps(realVerseIndices: number[], verses: VerseSegment[]): FlatStep[] {
  const understand = useProgressStore((state) => state.understandStageEnabled);
  const visualize = useProgressStore((state) => state.visualizeStageEnabled);
  const writeFirstLetter = useProgressStore((state) => state.writeFirstLetterStageEnabled);
  // `?? false`: self-healing for progress saved before this field existed.
  const rhythm = useProgressStore((state) => state.rhythmStageEnabled) ?? false;
  const wholeVerse = useProgressStore((state) => state.wholeVerseLearning) ?? false;
  const sayLadder = useProgressStore((state) => state.sayLadderLearning) ?? true;
  // A palace built for this path (the Palace tab) — each verse is placed in it as it's learned.
  const palaces = useProgressStore((state) => state.builtPalaces);
  const activePathKey = useProgressStore((state) => state.activePathKey);
  const first = verses[realVerseIndices[0]];
  const palace = Boolean(first && palaces?.length && (findPlacement(palaces, first) || palaceToPlaceIn(palaces, first, activePathKey)));
  // On unless turned off — undefined for progress saved before these stages existed.
  const lastLetters = useProgressStore((state) => state.lastLettersStageEnabled) ?? true;
  const timedType = useProgressStore((state) => state.timedTypeStageEnabled) ?? true;
  const payload = useProgressStore((state) => state.payloadStageEnabled) ?? true;
  const mathBreaks = useProgressStore((state) => state.mathBreakStageEnabled) ?? true;
  const pray = useProgressStore((state) => state.prayStageEnabled) ?? false;

  return useMemo(
    () => buildSteps(realVerseIndices, realVerseIndices.map((index) => senseLineCount(verses[index])), { understand, visualize, rhythm, writeFirstLetter, lastLetters, pray, timedType, payload, mathBreaks, wholeVerse, sayLadder, palace }),
    [realVerseIndices, verses, understand, visualize, rhythm, writeFirstLetter, lastLetters, pray, timedType, payload, mathBreaks, wholeVerse, sayLadder, palace],
  );
}
