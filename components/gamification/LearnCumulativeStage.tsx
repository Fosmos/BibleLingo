"use client";

import type { ReactNode } from "react";
import type { MemorizationDay, VerseSegment } from "@/types";
import type { ChapterReadingLayout } from "@/lib/useChapterReadingLayout";
import { useReportFocusVerse } from "@/lib/useReportFocusVerse";
import { ReviewChain } from "@/components/drills/ReviewChain";
import { PRIOR_VERSE_INDEX } from "@/lib/learnSteps";
import { usePriorLearnedVerse } from "@/lib/usePriorLearnedVerse";

interface LearnCumulativeStageProps {
  day: MemorizationDay;
  // The explicit verse list buildSteps already worked out for this exact check — either a
  // group's own so-far (a split day's per-half interim check) or every real verse learned
  // today (the split day's own final combine stage, right before Pray) — each led by the verse
  // just before it (PRIOR_VERSE_INDEX for the one before today's lesson).
  cumulativeVerseIndices: number[];
  layout: ChapterReadingLayout;
  topBar: ReactNode;
  embeddedInMindMap?: boolean;
  onAdvance: () => void;
}

// LearnSection.tsx's own "type everything learned today so far" step — split out purely to
// keep that file under this codebase's own 200-line cap (see CLAUDE.md), no behavior
// difference from having it inline there.
export function LearnCumulativeStage({ day, cumulativeVerseIndices, layout, topBar, embeddedInMindMap, onAdvance }: LearnCumulativeStageProps) {
  const reportVerse = useReportFocusVerse(embeddedInMindMap);
  // PRIOR_VERSE_INDEX stands for the learned verse just before today's lesson (see learnSteps.ts).
  const priorVerse = usePriorLearnedVerse(day);
  const versesLearnedSoFar = cumulativeVerseIndices
    .map((index) => (index === PRIOR_VERSE_INDEX ? priorVerse : day.newVerses[index]))
    .filter((verse): verse is VerseSegment => verse !== undefined);
  return (
    <>
      {topBar}
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-3 px-4 pt-3">
        {/* A wrong letter just costs accuracy and retries that word — never restarts the verse. */}
        <ReviewChain verses={versesLearnedSoFar} label="Remember" layout={layout} onComplete={onAdvance} restartOnMistake={false} onVerseChange={reportVerse} />
      </div>
    </>
  );
}
