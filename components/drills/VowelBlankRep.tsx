"use client";

import { useMemo, useState } from "react";
import type { VerseSegment } from "@/types";
import { playLetterSfx, resetLetterCombo } from "@/lib/audio";
import { tokenizeVerseWords } from "@/lib/verseWords";
import { AutoCompleteButton } from "@/components/ui/AutoCompleteButton";
import { OnScreenKeyboard } from "@/components/ui/OnScreenKeyboard";
import { InfoTip } from "@/components/ui/InfoTip";
import { INFO_TIPS } from "@/lib/infoTipCopy";
import type { ChapterReadingLayout } from "@/lib/useChapterReadingLayout";
import type { SenseLineWordRange } from "@/lib/senseLineWordRanges";
import { LessonControlBar } from "@/components/gamification/LessonControlBar";
import { LessonPageCard } from "@/components/gamification/LessonPageCard";
import { VOWEL, VowelWord } from "@/components/drills/VowelWord";
import { useReferenceGate } from "@/components/gamification/ReferenceGate";

interface VowelBlankRepProps {
  verse: VerseSegment;
  // The reading view's own real page layout (see lib/useChapterReadingLayout.ts), as on
  // FirstLetterBlankRep.tsx.
  layout: ChapterReadingLayout;
  onComplete: () => void;
}

interface VowelSlot {
  wordIndex: number;
  vowel: string;
}

// Fill in the vowels: every word shows its consonants and punctuation, every vowel blank. The
// reader types the vowels in order, one key at a time, each filling its blank.
export function VowelBlankRep({ verse, layout, onComplete }: VowelBlankRepProps) {
  const words = useMemo(() => tokenizeVerseWords(verse.text), [verse.text]);
  // Every vowel in the passage in reading order, and which slot each word's first vowel is.
  const { slots, firstSlots } = useMemo(() => {
    const all: VowelSlot[] = [];
    const firsts = words.map((word, wordIndex) => {
      const first = all.length;
      for (const character of word) if (VOWEL.test(character)) all.push({ wordIndex, vowel: character.toLowerCase() });
      return first;
    });
    return { slots: all, firstSlots: firsts };
  }, [words]);
  const [filledCount, setFilledCount] = useState(0);
  const [letterInput, setLetterInput] = useState("");
  const [showError, setShowError] = useState(false);
  // No blank is "next" while the stage's reference is entered first (ReferenceGate.tsx).
  const referenceFirst = useReferenceGate() !== null;

  const target = slots[filledCount];

  function handleLetterChange(value: string) {
    if (!target) return;
    const typed = value.toLowerCase();
    if (typed && typed === target.vowel) {
      playLetterSfx();
      setShowError(false);
      setLetterInput("");
      const next = filledCount + 1;
      if (next >= slots.length) onComplete();
      else setFilledCount(next);
    } else if (typed) {
      resetLetterCombo();
      setShowError(true);
      setLetterInput("");
    }
  }

  function renderActiveVerse(_: VerseSegment, range: SenseLineWordRange) {
    return (
      <>
        {words.slice(range.startIndex, range.endIndex).map((word, offset) => {
          const index = range.startIndex + offset;
          return (
            <span key={index}>
              <VowelWord word={word} firstSlot={firstSlots[index]} filledCount={filledCount} targetSlot={referenceFirst ? undefined : filledCount} showError={showError} />{" "}
            </span>
          );
        })}
      </>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <LessonPageCard layout={layout} activeVerse={verse} activeWordIndex={target?.wordIndex ?? words.length} renderActiveVerse={renderActiveVerse} />

      <LessonControlBar dockRef={layout.dockRef} verseText={verse.text}>
        <p className="flex items-center gap-1.5 self-center text-caption font-semibold uppercase tracking-wide text-brand-500 [.lesson-sheet-controls_&]:hidden">
          Type the missing vowels
          <InfoTip text={INFO_TIPS.vowelBlankRep} />
        </p>
        {/* Visually hidden, as on FirstLetterBlankRep.tsx: the on-screen keyboard is the visible
            way to type, but a physical keyboard and screen readers still need a focusable input. */}
        <input
          value={letterInput}
          onChange={(event) => handleLetterChange(event.target.value)}
          maxLength={1}
          autoFocus
          inputMode="none"
          aria-label="Type the next missing vowel"
          className="sr-only"
        />
        <OnScreenKeyboard onKey={handleLetterChange} />
        <AutoCompleteButton onClick={onComplete} />
      </LessonControlBar>
    </div>
  );
}
