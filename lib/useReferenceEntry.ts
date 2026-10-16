"use client";

import { useRef, useState } from "react";
import { playCorrectSfx, playIncorrectSfx, playLetterSfx } from "@/lib/audio";
import { isNumberPart, referenceParts, type ReferenceAnswer, type ReferencePart } from "@/lib/referenceAnswer";

export interface ReferenceEntry {
  // The part being asked for now — undefined once they're all in.
  part: ReferencePart | undefined;
  // What's been entered so far for each part (a number part fills in digit by digit).
  entered: Partial<Record<ReferencePart, string>>;
  // Parts answered wrongly: their answer is shown, and they must be entered correctly to go on.
  shown: Set<ReferencePart>;
  // A whole part at once (a bank tile, a spoken part) — false when it was wrong.
  answer: (part: ReferencePart, value: string) => boolean;
  // One more digit of the current number part (the book's number, chapter or verse).
  digit: (value: string) => void;
}

// The book's number (if it has one), book, chapter, then verse (lib/referenceAnswer.ts) — `onDone`
// once they're all right.
export function useReferenceEntry(correct: ReferenceAnswer, onDone: () => void): ReferenceEntry {
  const [index, setIndex] = useState(0);
  // Read synchronously, so one spoken phrase can fill book, chapter and verse in a single call.
  const indexRef = useRef(0);
  const [entered, setEntered] = useState<Partial<Record<ReferencePart, string>>>({});
  const [shown, setShown] = useState<Set<ReferencePart>>(new Set());
  const parts = referenceParts(correct);
  const part = parts[index];

  function accept(target: ReferencePart, value: string) {
    setEntered((prev) => ({ ...prev, [target]: value }));
    playCorrectSfx();
    const next = parts.indexOf(target) + 1;
    indexRef.current = next;
    setIndex(next);
    if (next >= parts.length) setTimeout(onDone, 450);
  }

  function miss(target: ReferencePart) {
    playIncorrectSfx();
    setShown((prev) => new Set(prev).add(target));
    setEntered((prev) => ({ ...prev, [target]: "" }));
  }

  return {
    part,
    entered,
    shown,
    answer: (target, value) => {
      if (target !== parts[indexRef.current]) return false;
      if (value.trim().toLowerCase() === correct[target].toLowerCase()) {
        accept(target, correct[target]);
        return true;
      }
      miss(target);
      return false;
    },
    digit: (value) => {
      if (!part || !isNumberPart(part)) return;
      const typed = `${entered[part] ?? ""}${value}`;
      if (!correct[part].startsWith(typed)) return miss(part);
      if (typed === correct[part]) return accept(part, typed);
      playLetterSfx();
      setEntered((prev) => ({ ...prev, [part]: typed }));
    },
  };
}
