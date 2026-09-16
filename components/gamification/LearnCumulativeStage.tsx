"use client";

import type { ReactNode } from "react";
import type { MemorizationDay } from "@/types";
import type { ChapterReadingLayout } from "@/lib/useChapterReadingLayout";
import { ReviewChain } from "@/components/drills/ReviewChain";

interface LearnCumulativeStageProps {
  day: MemorizationDay;
  // The explicit verse list buildSteps already worked out for this exact check — either a
  // group's own so-far (a split day's per-half interim check) or every real verse learned
  // today (the split day's own final combine stage, right before Pray).
  cumulativeVerseIndices: number[];
  layout: ChapterReadingLayout;
  topBar: ReactNode;
  onAdvance: () => void;
}

// LearnSection.tsx's own "type everything learned today so far" step — split out purely to
// keep that file under this codebase's own 200-line cap (see CLAUDE.md), no behavior
// difference from having it inline there.
export function LearnCumulativeStage({ day, cumulativeVerseIndices, layout, topBar, onAdvance }: LearnCumulativeStageProps) {
  const versesLearnedSoFar = cumulativeVerseIndices.map((index) => day.newVerses[index]);
  return (
    <>
      {topBar}
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-3 px-4 pt-3">
        <ReviewChain verses={versesLearnedSoFar} label="Remember" layout={layout} requirePerfectPass onComplete={onAdvance} />
      </div>
    </>
  );
}
