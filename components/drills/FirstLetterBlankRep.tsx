"use client";

import { useMemo, useState } from "react";
import type { VerseSegment } from "@/types";
import { playCorrectSfx, playIncorrectSfx, playLetterSfx, resetLetterCombo } from "@/lib/audio";
import { makeMathProblem, type MathProblem } from "@/lib/memoryChallenges";
import { senseLineWordRanges } from "@/lib/senseLineWordRanges";
import { tokenizeVerseWords, firstWordCharacter } from "@/lib/verseWords";
import { AutoCompleteButton } from "@/components/ui/AutoCompleteButton";
import { OnScreenKeyboard } from "@/components/ui/OnScreenKeyboard";
import { InfoTip } from "@/components/ui/InfoTip";
import { INFO_TIPS } from "@/lib/infoTipCopy";
import type { ChapterReadingLayout } from "@/lib/useChapterReadingLayout";
import type { SenseLineWordRange } from "@/lib/senseLineWordRanges";
import { LessonControlBar } from "@/components/gamification/LessonControlBar";
import { LessonPageCard } from "@/components/gamification/LessonPageCard";
import { HiddenWord } from "@/components/drills/HiddenWord";
import { StageTimer } from "@/components/drills/StageTimer";
import { MathBreakCard } from "@/components/drills/MathBreakCard";
import { useReferenceGate } from "@/components/gamification/ReferenceGate";

interface FirstLetterBlankRepProps {
  verse: VerseSegment;
  // The reading view's own real page layout (see lib/useChapterReadingLayout.ts) — Learn flow
  // only caller, so always set; the verse renders on the SAME real reading-view page/size/
  // position as browsing, via LessonPageCard.tsx.
  layout: ChapterReadingLayout;
  // The Last letters stage: every word shows its last letter, the first still to type.
  lastLetters?: boolean;
  // Against the clock: a timer runs from the first key to the last word.
  timed?: boolean;
  // A math problem to answer after each sense line but the last, before the next line's letters.
  mathBreaks?: boolean;
  onComplete: () => void;
}

// One pass with every word blank: the reader TYPES each word's first letter, in order — the same
// one-key-at-a-time input FirstLetterTypeRep.tsx uses — each typed letter filling in its word.
// With `lastLetters`, each word's last letter shows throughout as the clue.
export function FirstLetterBlankRep({ verse, layout, lastLetters = false, timed = false, mathBreaks = false, onComplete }: FirstLetterBlankRepProps) {
  const words = useMemo(() => tokenizeVerseWords(verse.text), [verse.text]);
  // Where each sense line but the last ends — where a math break pops up.
  const lineEnds = useMemo(() => new Set(senseLineWordRanges(verse.text).map((range) => range.endIndex)), [verse.text]);
  const [filledCount, setFilledCount] = useState(0);
  const [letterInput, setLetterInput] = useState("");
  const [showError, setShowError] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [stoppedAt, setStoppedAt] = useState<number | null>(null);
  const [math, setMath] = useState<{ problem: MathProblem; typed: string; error: boolean } | null>(null);

  // A digit towards the open math problem's answer — checked once it's as long as the answer.
  function handleMathKey(value: string) {
    if (!math || !/^[0-9]$/.test(value)) return;
    const typed = math.typed + value;
    if (typed.length < String(math.problem.answer).length) return setMath({ ...math, typed, error: false });
    if (Number(typed) === math.problem.answer) {
      playCorrectSfx();
      setMath(null);
    } else {
      playIncorrectSfx();
      setMath({ ...math, typed: "", error: true });
    }
  }

  // Every word is blank, typed in order — the next one is the word at `filledCount`.
  const targetIndex = filledCount < words.length ? filledCount : undefined;
  const targetWord = targetIndex !== undefined ? words[targetIndex] : undefined;

  function handleLetterChange(value: string) {
    setLetterInput("");
    if (math) return handleMathKey(value);
    if (!targetWord || stoppedAt !== null) return;
    if (timed && startedAt === null && value) setStartedAt(Date.now());
    const expected = firstWordCharacter(targetWord)?.toLowerCase();
    const typed = value.toLowerCase();
    if (typed && typed === expected) {
      playLetterSfx();
      setShowError(false);
      setLetterInput("");
      const next = filledCount + 1;
      if (next >= words.length && timed) {
        // Hold the finished time on screen a moment before moving on.
        setFilledCount(next);
        setStoppedAt(Date.now());
        setTimeout(onComplete, 1500);
      } else if (next >= words.length) onComplete();
      else {
        setFilledCount(next);
        if (mathBreaks && lineEnds.has(next)) setMath({ problem: makeMathProblem(), typed: "", error: false });
      }
    } else if (typed) {
      resetLetterCombo();
      setShowError(true);
      setLetterInput("");
    }
  }

  // No verse-number sup here — ChapterVerseRun.tsx already renders that verse's own real
  // number unconditionally. Called once per clause (see LessonPageCard.tsx's own
  // renderActiveVerse doc comment). Every word keeps its punctuation and its length
  // (HiddenWord.tsx): a word already typed shows its first letter; the rest show just their
  // underline — terracotta for the one asked for now, red after a miss.
  // No blank is "next" while the stage's reference is entered first (ReferenceGate.tsx).
  const referenceFirst = useReferenceGate() !== null;
  function renderActiveVerse(_: VerseSegment, range: SenseLineWordRange) {
    return (
      <>
        {words.slice(range.startIndex, range.endIndex).map((word, offset) => {
          const index = range.startIndex + offset;
          const isTarget = index === filledCount && !referenceFirst;
          const tone = index < filledCount ? "filled" : isTarget && showError ? "error" : isTarget ? "target" : "pending";
          return (
            <span key={index}>
              <HiddenWord word={word} firstLetter={index < filledCount} lastLetter={lastLetters} tone={tone} />{" "}
            </span>
          );
        })}
      </>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <LessonPageCard layout={layout} activeVerse={verse} activeWordIndex={targetIndex ?? words.length} renderActiveVerse={renderActiveVerse} />

      <LessonControlBar dockRef={layout.dockRef} verseText={verse.text}>
        <p className="flex items-center gap-1.5 self-center text-caption font-semibold uppercase tracking-wide text-brand-500 [.lesson-sheet-controls_&]:hidden">
          Type the first letter
          <InfoTip text={lastLetters ? INFO_TIPS.lastLetterBlankRep : timed ? INFO_TIPS.timedBlankRep : mathBreaks ? INFO_TIPS.mathBreakBlankRep : INFO_TIPS.firstLetterBlankRep} />
        </p>
        {timed && <StageTimer startedAt={startedAt} stoppedAt={stoppedAt} />}
        {/* Visually hidden, not removed — same as FirstLetterTypingControls.tsx: the on-screen
            keyboard is the visible way to type, and a wrong letter already shows on the card's
            own target blank (see renderActiveVerse's border-heart-500), but a physical keyboard
            and screen readers still need a focusable input. */}
        <input
          value={letterInput}
          onChange={(event) => handleLetterChange(event.target.value)}
          maxLength={1}
          autoFocus
          // The on-screen keyboard is the way to type here — never pop the phone's own over it.
          inputMode="none"
          aria-label="Type the first letter of the next word"
          className="sr-only"
        />
        <OnScreenKeyboard onKey={handleLetterChange} />
        <AutoCompleteButton onClick={onComplete} />
      </LessonControlBar>
      {math && <MathBreakCard problem={math.problem} typed={math.typed} error={math.error} />}
    </div>
  );
}
