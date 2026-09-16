"use client";

import { useMemo, useState } from "react";
import type { VerseSegment } from "@/types";
import { playCorrectSfx, playIncorrectSfx } from "@/lib/audio";
import { tokenizeVerseWords, firstWordCharacter } from "@/lib/verseWords";
import { blankIndicesImportantFirst } from "@/lib/wordImportance";
import { AutoCompleteButton } from "@/components/ui/AutoCompleteButton";
import { OnScreenKeyboard } from "@/components/ui/OnScreenKeyboard";
import { InfoTip } from "@/components/ui/InfoTip";
import { INFO_TIPS } from "@/lib/infoTipCopy";
import type { ChapterReadingLayout } from "@/lib/useChapterReadingLayout";
import type { SenseLineWordRange } from "@/lib/senseLineWordRanges";
import { LessonControlBar } from "@/components/gamification/LessonControlBar";
import { LessonPageCard } from "@/components/gamification/LessonPageCard";

interface FirstLetterBlankRepProps {
  verse: VerseSegment;
  // The reading view's own real page layout (see lib/useChapterReadingLayout.ts) — Learn flow
  // only caller, so always set; the verse renders on the SAME real reading-view page/size/
  // position as browsing, via LessonPageCard.tsx.
  layout: ChapterReadingLayout;
  onComplete: () => void;
}

// Two passes, the same shape as FillInTheBlankRep.tsx's own sibling stage: the first blanks
// about half the verse's own words (content words prioritized — see lib/wordImportance.ts), the
// second blanks every word. Unlike that stage's tap-a-tile-from-a-bank interaction, here the
// reader TYPES each blanked word's own first letter, in order — the same one-key-at-a-time input
// FirstLetterTypeRep.tsx uses for its own full-verse blind check later in the lesson, just
// scoped to a SUBSET of the verse's own words here instead of all of them.
const REP_COUNT = 2;
// A mistake reverts to the last checkpoint rather than the very first blank — same leniency
// FillInTheBlankRep.tsx's own sibling stage already extends.
const CHECKPOINT_SIZE = 4;

export function FirstLetterBlankRep({ verse, layout, onComplete }: FirstLetterBlankRepProps) {
  const words = useMemo(() => tokenizeVerseWords(verse.text), [verse.text]);
  const [repIndex, setRepIndex] = useState(0);
  const blankIndices = useMemo(
    () => blankIndicesImportantFirst(words, repIndex === 0 ? Math.ceil(words.length / 2) : words.length),
    // Re-derived only on a real verse/rep change, not on every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [verse.id, repIndex],
  );
  const [filledCount, setFilledCount] = useState(0);
  const [letterInput, setLetterInput] = useState("");
  const [showError, setShowError] = useState(false);

  const targetIndex = blankIndices[filledCount];
  const targetWord = targetIndex !== undefined ? words[targetIndex] : undefined;

  function handleLetterChange(value: string) {
    if (!targetWord) return;
    const expected = firstWordCharacter(targetWord)?.toLowerCase();
    const typed = value.toLowerCase();
    if (typed && typed === expected) {
      playCorrectSfx();
      setShowError(false);
      setLetterInput("");
      const next = filledCount + 1;
      if (next >= blankIndices.length) {
        if (repIndex + 1 >= REP_COUNT) {
          onComplete();
        } else {
          setRepIndex((prev) => prev + 1);
          setFilledCount(0);
        }
      } else {
        setFilledCount(next);
      }
    } else if (typed) {
      playIncorrectSfx();
      setShowError(true);
      setLetterInput("");
      setFilledCount(Math.floor(filledCount / CHECKPOINT_SIZE) * CHECKPOINT_SIZE);
    }
  }

  // No verse-number sup here — ChapterVerseRun.tsx already renders that verse's own real
  // number unconditionally (see LessonPageCard.tsx's own doc comment). Called once per clause
  // (see LessonPageCard.tsx's own renderActiveVerse doc comment).
  function renderActiveVerse(_: VerseSegment, range: SenseLineWordRange) {
    return (
      <>
        {words.slice(range.startIndex, range.endIndex).map((word, offset) => {
          const index = range.startIndex + offset;
          const slotPosition = blankIndices.indexOf(index);
          if (slotPosition === -1) return <span key={index}>{word} </span>;
          const isFilled = slotPosition < filledCount;
          const isTarget = slotPosition === filledCount;
          return (
            <span
              key={index}
              className={`inline-flex min-w-8 items-center justify-center rounded-lg border-2 border-dashed px-2 py-0.5 ${
                isFilled
                  ? "border-brand-500 bg-brand-50 font-medium text-brand-700 dark:bg-brand-950 dark:text-brand-300"
                  : isTarget && showError
                    ? "border-heart-500"
                    : isTarget
                      ? "border-brand-400 dark:border-brand-600"
                      : "border-line dark:border-zinc-700"
              }`}
            >
              {isFilled ? word : " "}
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
        <p className="flex items-center gap-1.5 self-center text-caption font-semibold uppercase tracking-wide text-brand-500">
          Type the first letter <InfoTip text={INFO_TIPS.firstLetterBlankRep} />
        </p>
        <p className="self-center text-xs text-ink-muted">
          Rep {repIndex + 1} of {REP_COUNT}
        </p>
        <input
          value={letterInput}
          onChange={(event) => handleLetterChange(event.target.value)}
          maxLength={1}
          autoFocus
          aria-label="Type the first letter of the next word"
          className={`w-16 self-center rounded-xl border p-3 text-center text-xl focus:outline-none focus-visible:ring-2 dark:bg-zinc-900 ${
            showError ? "border-heart-500 focus-visible:ring-heart-500" : "border-line focus-visible:ring-brand-500 dark:border-zinc-700"
          }`}
        />
        <OnScreenKeyboard onKey={handleLetterChange} />
        <AutoCompleteButton onClick={onComplete} />
      </LessonControlBar>
    </div>
  );
}
