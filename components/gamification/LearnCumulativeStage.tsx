"use client";

import type { ReactNode } from "react";
import type { MemorizationDay, VerseSegment } from "@/types";
import type { ChapterReadingLayout } from "@/lib/useChapterReadingLayout";
import { useReportFocusVerse } from "@/lib/useReportFocusVerse";
import { ReviewChain } from "@/components/drills/ReviewChain";

interface LearnCumulativeStageProps {
  day: MemorizationDay;
  // Which of today's verses this check types.
  cumulativeVerseIndices: number[];
  layout: ChapterReadingLayout;
  topBar: ReactNode;
  embeddedInMindMap?: boolean;
  onAdvance: () => void;
}

// LearnSection.tsx's "type today's verses together" step — split out purely to
// keep that file under this codebase's own 200-line cap (see CLAUDE.md), no behavior
// difference from having it inline there.
export function LearnCumulativeStage({ day, cumulativeVerseIndices, layout, topBar, embeddedInMindMap, onAdvance }: LearnCumulativeStageProps) {
  const reportVerse = useReportFocusVerse(embeddedInMindMap);
  const versesLearnedSoFar = cumulativeVerseIndices
    .map((index) => day.newVerses[index])
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
