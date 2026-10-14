"use client";

import type { ReactNode } from "react";
import type { MemorizationDay, VerseSegment } from "@/types";
import type { ChapterReadingLayout } from "@/lib/useChapterReadingLayout";
import { useReportFocusVerse } from "@/lib/useReportFocusVerse";
import { ReviewChain } from "@/components/drills/ReviewChain";
import { usePriorLearnedVerses } from "@/lib/usePriorLearnedVerse";

interface LearnCumulativeStageProps {
  day: MemorizationDay;
  // The rolling window buildSteps worked out for this check — a verse and the three before it, the
  // negative indices standing for the learned verses just before today's lesson (PRIOR_VERSE_INDICES).
  cumulativeVerseIndices: number[];
  layout: ChapterReadingLayout;
  topBar: ReactNode;
  embeddedInMindMap?: boolean;
  onAdvance: () => void;
}

// LearnSection.tsx's rolling "type this verse with the three before it" step — split out purely to
// keep that file under this codebase's own 200-line cap (see CLAUDE.md), no behavior
// difference from having it inline there.
export function LearnCumulativeStage({ day, cumulativeVerseIndices, layout, topBar, embeddedInMindMap, onAdvance }: LearnCumulativeStageProps) {
  const reportVerse = useReportFocusVerse(embeddedInMindMap);
  // -1 is the learned verse right before today's lesson, -2 and -3 the ones before it (nearest last).
  const priorVerses = usePriorLearnedVerses(day);
  const versesLearnedSoFar = cumulativeVerseIndices
    .map((index) => (index < 0 ? priorVerses[priorVerses.length + index] : day.newVerses[index]))
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
