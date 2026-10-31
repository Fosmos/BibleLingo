"use client";

import { useState } from "react";
import type { MemorizationDay, VerseSegment } from "@/types";
import type { FlatStep } from "@/lib/learnSteps";
import type { ReferenceMode } from "@/lib/referenceAnswer";

// The recall stages of a Learn lesson, and how each one's reference is entered — the way the
// stage itself is (Visualize, Listen and repeat and the other teaching stages ask for none).
const MODES: Partial<Record<FlatStep["phase"], ReferenceMode>> = {
  fill_in_the_blank: "bank",
  fill_in_the_blank_letters: "letters",
  type_from_last_letters: "letters",
  type_timed: "letters",
  type_math: "letters",
  speak_payload: "speak",
  type_cumulative_today: "letters",
  speak_hint: "speak",
  speak_verse: "speak",
};

export interface ReferenceStep {
  // Set while a recall stage waits on its reference — recalled first, as the verse's opening
  // line, before its words: which verse, entered how.
  asking: { verse: VerseSegment; mode: ReferenceMode } | null;
  // The reference is in — on to the stage's words.
  done: () => void;
}

// The verse a step is about: its own, or for a cumulative check the newest of today's verses in it.
function stepVerse(step: FlatStep, day: MemorizationDay): VerseSegment | undefined {
  if (step.verseIndex !== undefined) return day.newVerses[step.verseIndex];
  const newest = Math.max(-1, ...(step.cumulativeVerseIndices ?? []));
  return newest >= 0 ? day.newVerses[newest] : undefined;
}

// Learn only (reviews don't ask): each recall stage opens on its verse's reference — on a
// sense-line stage, only one that takes in the verse's first line, which the reference belongs to.
export function useReferenceStep(step: FlatStep | undefined, stepIndex: number, day: MemorizationDay): ReferenceStep {
  const [answeredAt, setAnsweredAt] = useState<number | null>(null);
  const mode = step && !step.noReference && (!step.lines || step.lines[0] === 0) ? MODES[step.phase] : undefined;
  const verse = step ? stepVerse(step, day) : undefined;
  return {
    asking: mode && verse && answeredAt !== stepIndex ? { verse, mode } : null,
    done: () => setAnsweredAt(stepIndex),
  };
}
