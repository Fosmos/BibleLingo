"use client";

import { useEffect, useState } from "react";
import type { FlatStep } from "@/lib/learnSteps";
import type { Phase } from "@/components/gamification/LearnPhaseContent";
import { useLessonSessionStore } from "@/store/useLessonSessionStore";

// The drills said aloud, and the ones typed by first letter — either kind can be switched to the
// other with the lesson page's Speak / Type chip (DrillHelpChips.tsx).
const SPEAK = new Set<Phase>(["speak_hint", "speak_verse", "speak_payload"]);
const TYPE = new Set<Phase>(["fill_in_the_blank_letters", "type_from_last_letters", "type_timed", "type_math"]);

export interface InputSwap {
  // The step as it runs: a spoken drill switched to typing runs as Type it by first letter, a
  // typed one switched to speaking as Say it from memory, over the same lines.
  step: FlatStep | undefined;
  // Hold the code switched to typing: its payload stays, with the verse typed in between.
  typedPayload: boolean;
}

// Whether the reader would rather speak or type, for the rest of this lesson — null until they
// pick, when each drill keeps its own. Publishes the chip (to the other way) on every drill that
// can switch.
export function useInputSwap(step: FlatStep | undefined): InputSwap {
  const [preferred, setPreferred] = useState<"speak" | "type" | null>(null);
  const setInputSwap = useLessonSessionStore((state) => state.setInputSwap);
  const phase = step?.phase;
  const switchable = phase !== undefined && (SPEAK.has(phase) || TYPE.has(phase));
  const speaking = switchable && (preferred ? preferred === "speak" : SPEAK.has(phase));

  useEffect(() => {
    setInputSwap(switchable ? { to: speaking ? "type" : "speak", choose: setPreferred } : null);
  }, [switchable, speaking, setInputSwap]);
  useEffect(() => () => setInputSwap(null), [setInputSwap]);

  if (!step || !switchable) return { step, typedPayload: false };
  if (SPEAK.has(step.phase) && !speaking) {
    return step.phase === "speak_payload" ? { step, typedPayload: true } : { step: { ...step, phase: "fill_in_the_blank_letters" }, typedPayload: false };
  }
  if (TYPE.has(step.phase) && speaking) return { step: { ...step, phase: "speak_verse" }, typedPayload: false };
  return { step, typedPayload: false };
}
