"use client";

import type { ReactNode } from "react";
import type { VerseSegment, MemorizationDay } from "@/types";
import { paginateVerseWindow } from "@/lib/chapterPagination";
import type { ChapterReadingLayout } from "@/lib/useChapterReadingLayout";
import { SpeakRep } from "@/components/drills/SpeakRep";

interface LearnSpeakVerseStageProps {
  day: MemorizationDay;
  verseIndex: number | undefined;
  contextVerses: VerseSegment[];
  heading: string | undefined;
  layout: ChapterReadingLayout;
  topBar: ReactNode;
  onAdvance: () => void;
}

// LearnSection.tsx's own "speak_verse" step — just the one verse this stage follows, spoken
// aloud from memory on its own, not folded into everything learned so far (that's
// ReviewSection's job). Same mechanic ChapterReviewStage's own "Recite it all" stage uses.
// firstLettersOnMistake keeps a miss from handing back the answer it's testing.
// contextVerses/heading windowed like every per-verse stage LearnSection.tsx itself renders.
// Split out purely to keep that file under this codebase's own 200-line cap (see CLAUDE.md),
// no behavior difference from having it inline there.
export function LearnSpeakVerseStage({ day, verseIndex, contextVerses, heading, layout, topBar, onAdvance }: LearnSpeakVerseStageProps) {
  const verseForStage = day.newVerses[verseIndex ?? day.newVerses.length - 1];
  const speakWindow = paginateVerseWindow(contextVerses, heading, verseForStage.id, layout.pageBudget);
  return (
    <>
      {topBar}
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-3 px-4 pt-3">
        <SpeakRep
          label="Remember"
          reference={verseForStage.reference}
          targetText={verseForStage.text}
          reps={1}
          verse={verseForStage}
          contextVerses={speakWindow.verses}
          layout={layout}
          firstLettersOnMistake
          onComplete={onAdvance}
        />
      </div>
    </>
  );
}
