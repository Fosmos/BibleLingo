"use client";

import { useMemo, useState } from "react";
import type { VerseSegment } from "@/types";
import { playLetterSfx, resetLetterCombo } from "@/lib/audio";
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

// Two passes, the same shape as FillInTheBlankRep.tsx's own sibling stage: the first blanks
// about half the verse's own words (content words prioritized — see lib/wordImportance.ts), the
// second blanks every word. Unlike that stage's tap-a-tile-from-a-bank interaction, here the
// reader TYPES each blanked word's own first letter, in order — the same one-key-at-a-time input
// FirstLetterTypeRep.tsx uses, scoped to a SUBSET of the verse's own words. The words that aren't
// blanked show as just their first letters too, never the full text.
const REP_COUNT = 2;

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
      playLetterSfx();
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
      resetLetterCombo();
      setShowError(true);
      setLetterInput("");
    }
  }

  // No verse-number sup here — ChapterVerseRun.tsx already renders that verse's own real
  // number unconditionally. Called once per clause (see LessonPageCard.tsx's own
  // renderActiveVerse doc comment). Every word keeps its punctuation and its length
  // (HiddenWord.tsx): a word not blanked this rep, or already typed, shows its first letter; a
  // blank shows just its underline — terracotta for the one asked for now, red after a miss.
  // No blank is "next" while the stage's reference is entered first (ReferenceGate.tsx).
  const referenceFirst = useReferenceGate() !== null;
  function renderActiveVerse(_: VerseSegment, range: SenseLineWordRange) {
    return (
      <>
        {words.slice(range.startIndex, range.endIndex).map((word, offset) => {
          const index = range.startIndex + offset;
          const slotPosition = blankIndices.indexOf(index);
          const isTarget = slotPosition === filledCount && !referenceFirst;
          const tone = slotPosition === -1 ? "pending" : slotPosition < filledCount ? "filled" : isTarget && showError ? "error" : isTarget ? "target" : "pending";
          return (
            <span key={index}>
              <HiddenWord word={word} firstLetter={slotPosition === -1 || slotPosition < filledCount} tone={tone} />{" "}
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
          <span className="font-normal normal-case tracking-normal text-ink-muted">
            · Rep {repIndex + 1} of {REP_COUNT}
          </span>
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
