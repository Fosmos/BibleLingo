"use client";

import { useMemo, useState } from "react";
import type { VerseSegment } from "@/types";
import { playLetterSfx, resetLetterCombo } from "@/lib/audio";
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
import { useReferenceGate } from "@/components/gamification/ReferenceGate";

interface FirstLetterBlankRepProps {
  verse: VerseSegment;
  // The reading view's own real page layout (see lib/useChapterReadingLayout.ts) — Learn flow
  // only caller, so always set; the verse renders on the SAME real reading-view page/size/
  // position as browsing, via LessonPageCard.tsx.
  layout: ChapterReadingLayout;
  onComplete: () => void;
}

// One pass with every word blank: the reader TYPES each word's first letter, in order — the same
// one-key-at-a-time input FirstLetterTypeRep.tsx uses — each typed letter filling in its word.
export function FirstLetterBlankRep({ verse, layout, onComplete }: FirstLetterBlankRepProps) {
  const words = useMemo(() => tokenizeVerseWords(verse.text), [verse.text]);
  const [filledCount, setFilledCount] = useState(0);
  const [letterInput, setLetterInput] = useState("");
  const [showError, setShowError] = useState(false);

  // Every word is blank, typed in order — the next one is the word at `filledCount`.
  const targetIndex = filledCount < words.length ? filledCount : undefined;
  const targetWord = targetIndex !== undefined ? words[targetIndex] : undefined;

  function handleLetterChange(value: string) {
    if (!targetWord) return;
    const expected = firstWordCharacter(targetWord)?.toLowerCase();
    const typed = value.toLowerCase();
    if (typed && typed === expected) {
      playLetterSfx();
      setShowError(false);
      setLetterInput("");
      const next = filledCount + 1;
      if (next >= words.length) onComplete();
      else setFilledCount(next);
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
              <HiddenWord word={word} firstLetter={index < filledCount} tone={tone} />{" "}
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
          <InfoTip text={INFO_TIPS.firstLetterBlankRep} />
        </p>
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
    </div>
  );
}
