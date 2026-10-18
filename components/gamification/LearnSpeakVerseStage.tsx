"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";
import type { VerseSegment, MemorizationDay } from "@/types";
import { paginateVerseWindow } from "@/lib/chapterPagination";
import type { ChapterReadingLayout } from "@/lib/useChapterReadingLayout";
import { SpeakRep } from "@/components/drills/SpeakRep";
import { FirstLetterBlankRep } from "@/components/drills/FirstLetterBlankRep";
import { senseLineSlice } from "@/lib/senseLineSlice";
import { makePayload } from "@/lib/memoryChallenges";
import { tokenizeVerseWords } from "@/lib/verseWords";
import { PayloadFlash } from "@/components/drills/PayloadFlash";
import { PayloadRecall } from "@/components/drills/PayloadRecall";
import { LessonPageCard } from "@/components/gamification/LessonPageCard";
import { LessonControlBar } from "@/components/gamification/LessonControlBar";

interface LearnSpeakVerseStageProps {
  day: MemorizationDay;
  verseIndex: number | undefined;
  // The sense lines said (lib/learnSteps.ts) — the whole verse when unset.
  lines?: [number, number];
  contextVerses: VerseSegment[];
  heading: string | undefined;
  layout: ChapterReadingLayout;
  topBar: ReactNode;
  // The payload stage: a number and color flash up first, and must be recalled after.
  payload?: boolean;
  // Typed by first letter instead of said aloud (the Speak / Type chip, lib/useInputSwap.ts).
  typed?: boolean;
  onAdvance: () => void;
}

// LearnSection.tsx's own "speak_verse" step — the lines learned so far of the one verse (or the
// whole verse) this stage follows, spoken
// aloud from memory on its own, not folded into everything learned so far (that's
// ReviewSection's job). Same mechanic ChapterReviewStage's own "Recite it all" stage uses.
// firstLettersOnMistake keeps a miss from handing back the answer it's testing.
// contextVerses/heading windowed like every per-verse stage LearnSection.tsx itself renders.
// Split out purely to keep that file under this codebase's own 200-line cap (see CLAUDE.md),
// no behavior difference from having it inline there.
//
// With `payload`, the stage is bracketed: a number and color flash for 2 seconds first
// (PayloadFlash.tsx), then after the verse is said they must be picked to move on (PayloadRecall.tsx).
export function LearnSpeakVerseStage({
  day,
  verseIndex,
  lines,
  contextVerses,
  heading,
  layout,
  topBar,
  payload: withPayload = false,
  typed = false,
  onAdvance,
}: LearnSpeakVerseStageProps) {
  const fullVerse = day.newVerses[verseIndex ?? day.newVerses.length - 1];
  const verseForStage = lines ? senseLineSlice(fullVerse, lines) : fullVerse;
  const speakWindow = paginateVerseWindow(
    contextVerses,
    heading,
    fullVerse.id,
    layout.pageBudget,
  );
  const [payload] = useState(makePayload);
  const [part, setPart] = useState<"flash" | "speak" | "recall">(
    withPayload ? "flash" : "speak",
  );
  const words = useMemo(
    () => tokenizeVerseWords(verseForStage.text),
    [verseForStage.text],
  );
  const endFlash = useCallback(() => setPart("speak"), []);
  const afterRecite = withPayload ? () => setPart("recall") : onAdvance;

  if (part === "recall") {
    return (
      <>
        {topBar}
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-3 px-4 pt-3">
          <LessonPageCard
            layout={layout}
            activeVerse={verseForStage}
            activeWordIndex={words.length}
            renderActiveVerse={(_, range) =>
              words.slice(range.startIndex, range.endIndex).join(" ")
            }
          />
          <LessonControlBar
            dockRef={layout.dockRef}
            verseText={verseForStage.text}
          >
            <PayloadRecall payload={payload} onCorrect={onAdvance} />
          </LessonControlBar>
        </div>
      </>
    );
  }

  return (
    <>
      {topBar}
      {part === "flash" && <PayloadFlash payload={payload} onDone={endFlash} />}
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-3 px-4 pt-3">
        {typed ? (
          <FirstLetterBlankRep
            verse={verseForStage}
            layout={layout}
            onComplete={afterRecite}
          />
        ) : (
          <SpeakRep
            label="Remember"
            reference={verseForStage.reference}
            targetText={verseForStage.text}
            reps={1}
            verse={verseForStage}
            contextVerses={speakWindow.verses}
            layout={layout}
            firstLettersOnMistake
            onComplete={afterRecite}
          />
        )}
      </div>
    </>
  );
}
