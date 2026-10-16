"use client";

import { useState } from "react";
import type { VerseSegment } from "@/types";
import type { ChapterReadingLayout } from "@/lib/useChapterReadingLayout";
import { formatVerseSpanLabel } from "@/lib/chapterContent";
import { ReferenceGate } from "@/components/gamification/ReferenceGate";
import { LessonPageCard } from "@/components/gamification/LessonPageCard";
import { LessonControlBar } from "@/components/gamification/LessonControlBar";

interface RecallReferenceQuestionProps {
  verse: VerseSegment;
  layout: ChapterReadingLayout;
  onAnswered: (correct: boolean) => void;
  onNext: () => void;
}

// A Recall Quiz question shown as the verse: where is it from? The verse sits in the lesson's
// verse zone with nothing that gives it away (no reference, no neighbouring lines), and the
// reference is entered into its blocks the way a lesson asks for it (ReferenceGate.tsx, typed on
// the keyboard). Right first time counts; a miss shows that part, to enter again. Then the answer.
export function RecallReferenceQuestion({ verse, layout, onAnswered, onNext }: RecallReferenceQuestionProps) {
  const [result, setResult] = useState<boolean | null>(null);

  function done(hadMiss: boolean) {
    setResult(!hadMiss);
    onAnswered(!hadMiss);
  }

  return (
    <ReferenceGate asking={result === null ? { verse, mode: "letters" } : null} onDone={done}>
      <LessonPageCard layout={layout} activeVerse={verse} hideWhereFrom={result === null} renderActiveVerse={(_, range) => range.clause.text} />
      <LessonControlBar dockRef={layout.dockRef}>
        {result !== null && (
          <div className={`flex w-full items-center gap-3 rounded-[24px] px-5 py-4 ${result ? "bg-sage-100 text-sage-900" : "bg-brand-100 text-brand-900"}`}>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="text-xs font-extrabold uppercase tracking-[.06em]">{result ? "Correct" : "Not quite"}</span>
              <span className="font-heading text-xl leading-tight">{formatVerseSpanLabel(verse.book, verse.chapter, verse.verseNumber, verse.verseNumber)}</span>
            </div>
            <button type="button" onClick={onNext} className="rounded-full bg-ink px-5 py-2.5 text-sm font-extrabold text-paper dark:bg-zinc-100 dark:text-zinc-900">
              Next
            </button>
          </div>
        )}
      </LessonControlBar>
    </ReferenceGate>
  );
}
