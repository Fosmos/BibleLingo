"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { VerseSegment } from "@/types";
import { referenceAnswer, type ReferenceMode } from "@/lib/referenceAnswer";
import { useReferenceEntry } from "@/lib/useReferenceEntry";
import { useLessonSessionStore } from "@/store/useLessonSessionStore";
import { ReferenceSlots } from "@/components/drills/ReferenceSlots";
import { ReferenceBankEntry } from "@/components/drills/ReferenceBankEntry";
import { ReferenceKeyEntry } from "@/components/drills/ReferenceKeyEntry";
import { ReferenceSpeakEntry } from "@/components/drills/ReferenceSpeakEntry";
import { AutoCompleteButton } from "@/components/ui/AutoCompleteButton";

interface ReferenceGateValue {
  // The reference's slots, in the verse's own reference line (LessonPageCard.tsx).
  slot: ReactNode;
  // What the stage's controls show until the reference is in (LessonControlBar.tsx).
  entry: ReactNode;
}

const ReferenceGateContext = createContext<ReferenceGateValue | null>(null);

// Set while a Learn recall stage's reference is still being entered — null otherwise.
export const useReferenceGate = () => useContext(ReferenceGateContext);

interface ReferenceGateProps {
  asking: { verse: VerseSegment; mode: ReferenceMode } | null;
  // The reference is in — whether any part was missed (or skipped) on the way.
  onDone: (hadMiss: boolean) => void;
  children: ReactNode;
}

const PROMPT: Record<ReferenceMode, string> = {
  bank: "Start with where it's from — tap the book, chapter and verse",
  letters: "Start with where it's from — the book's first letter, then the numbers",
  speak: "Start with where it's from — say the book, chapter and verse",
};

const NO_REFERENCE = { number: "", book: "", chapter: "", verse: "" };

// A Learn recall stage (not review) drills the verse's reference as the opening of the verse
// itself: the stage is on screen from the start, the reference waits in slots on the verse's top
// line, and the stage's controls take the reference first — entered the stage's own way (bank,
// typed, said; lib/referenceAnswer.ts) — then carry straight on to the words. Always the same
// element around the stage (keyed per step by the caller), so the stage doesn't remount when the
// reference goes in.
export function ReferenceGate({ asking, onDone, children }: ReferenceGateProps) {
  const correct = asking ? referenceAnswer(asking.verse) : NO_REFERENCE;
  const entry = useReferenceEntry(correct, onDone);
  // The lesson page's tray has no prompt text — its slots, ringed, say what's asked.
  const lessonPage = useLessonSessionStore((state) => state.lessonPageOpen);
  const Entry = asking?.mode === "bank" ? ReferenceBankEntry : asking?.mode === "speak" ? ReferenceSpeakEntry : ReferenceKeyEntry;
  const value: ReferenceGateValue | null = asking
    ? {
        slot: <ReferenceSlots entry={entry} correct={correct} />,
        entry: (
          <>
            {!lessonPage && <p className="text-center text-caption font-semibold uppercase tracking-wide text-brand-500">{PROMPT[asking.mode]}</p>}
            <Entry entry={entry} correct={correct} />
            <AutoCompleteButton onClick={() => onDone(true)} />
          </>
        ),
      }
    : null;
  return <ReferenceGateContext.Provider value={value}>{children}</ReferenceGateContext.Provider>;
}
