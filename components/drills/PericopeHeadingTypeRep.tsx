"use client";

import { useMemo, useState } from "react";
import { playCorrectSfx, playIncorrectSfx } from "@/lib/audio";
import { buildHeadingUnits } from "@/lib/pericopeHeadingTyping";
import { MistakeLetterHint } from "@/components/drills/MistakeLetterHint";
import { AutoCompleteButton } from "@/components/ui/AutoCompleteButton";
import { InfoTip } from "@/components/ui/InfoTip";
import { INFO_TIPS } from "@/lib/infoTipCopy";

interface PericopeHeadingTypeRepProps {
  book: string;
  chapter: number;
  startVerse: number;
  endVerse: number;
  heading: string;
  onComplete: () => void;
}

// Types a section heading, blind, by first letter — right in the same spot and styling
// (text-2xl font-semibold, matching VerseReferenceHeader.tsx's own pericope line) the real
// heading occupies once confirmed, so it reads as "this heading, being typed" rather than a
// separate exercise elsewhere that later jumps up into position. The chapter/verse reference
// itself (e.g. "5:21-43") types one digit at a time rather than by first letter — see
// lib/pericopeHeadingTyping.ts. Never counts toward accuracy — used by SrsEntityRecall.tsx
// right before the verse(s) each heading opens.
export function PericopeHeadingTypeRep({ book, chapter, startVerse, endVerse, heading, onComplete }: PericopeHeadingTypeRepProps) {
  const units = useMemo(() => buildHeadingUnits(book, chapter, startVerse, endVerse, heading), [book, chapter, startVerse, endVerse, heading]);
  const [unitIndex, setUnitIndex] = useState(0);
  const [letterInput, setLetterInput] = useState("");
  const [showError, setShowError] = useState(false);
  const [wrongLetterExpected, setWrongLetterExpected] = useState<string | null>(null);

  const currentUnit = units[unitIndex];
  const revealedText = units
    .slice(0, unitIndex)
    .map((unit) => unit.prefix + unit.display)
    .join("");

  function handleLetterChange(value: string) {
    if (!currentUnit) return;
    const typed = value.toLowerCase();

    if (typed && typed === currentUnit.typeChar) {
      playCorrectSfx();
      setShowError(false);
      setWrongLetterExpected(null);
      setLetterInput("");
      const next = unitIndex + 1;
      if (next >= units.length) {
        onComplete();
      } else {
        setUnitIndex(next);
      }
    } else if (typed) {
      playIncorrectSfx();
      setShowError(true);
      setWrongLetterExpected(currentUnit.typeChar);
      setLetterInput("");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="flex items-center gap-1.5 text-caption font-semibold uppercase tracking-wide text-brand-500">
          This section&apos;s heading — type it by first letter (doesn&apos;t count toward accuracy)
          <InfoTip text={INFO_TIPS.firstLetterTypeRep} />
        </p>
        <p className="my-8 min-h-[2em] text-2xl font-semibold text-brand-800 dark:text-brand-200">{revealedText}</p>
      </div>
      <input
        value={letterInput}
        onChange={(event) => handleLetterChange(event.target.value)}
        maxLength={1}
        autoFocus
        aria-label="Type the first letter of the next word"
        className={`w-16 rounded-xl border p-3 text-center text-xl focus:outline-none focus-visible:ring-2 dark:bg-zinc-900 ${showError ? "border-heart-500 focus-visible:ring-heart-500" : "border-line focus-visible:ring-brand-500 dark:border-zinc-700"}`}
      />
      {showError && wrongLetterExpected && <MistakeLetterHint key={unitIndex} expectedLetter={wrongLetterExpected} autoReveal />}
      <AutoCompleteButton onClick={onComplete} />
    </div>
  );
}
