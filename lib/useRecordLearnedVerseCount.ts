"use client";

import { useEffect } from "react";
import type { FlatStep } from "@/lib/learnSteps";
import { useProgressStore } from "@/store/useProgressStore";

// The checkpoint field holding how many of a lesson day's own `newVerses` (from the start) are
// already finished — see lib/mindMapLessonLearnedTree.ts, which reads it back.
export const LEARNED_VERSE_COUNT_FIELD = "learnedVerseCount";

// Records, in the lesson's own session checkpoint, how far through today's verses the lesson has
// got: a verse counts once every one of its own stages (through its Speak verse stage) is behind
// the reader. Being part of the checkpoint, it outlives leaving the lesson half-way and is only
// cleared once the whole day completes — at which point completedDays covers those verses anyway.
// The Mind Map uses it to check off each verse (and fill in its trail) the moment it's done.
export function useRecordLearnedVerseCount(sessionKey: string | undefined, steps: FlatStep[], stepIndex: number): void {
  const patchSessionCheckpoint = useProgressStore((state) => state.patchSessionCheckpoint);
  const stored = useProgressStore((state) => (sessionKey ? state.sessionCheckpoints[sessionKey]?.[LEARNED_VERSE_COUNT_FIELD] : undefined));

  let learnedCount = 0;
  steps.forEach((step, index) => {
    if (step.verseIndex === undefined) return;
    const isLastOfVerse = !steps.slice(index + 1).some((later) => later.verseIndex === step.verseIndex);
    if (isLastOfVerse && index < stepIndex) learnedCount = Math.max(learnedCount, step.verseIndex + 1);
  });

  useEffect(() => {
    // Never moves backwards — a resumed lesson re-derives the same count from its own restored
    // step anyway, and a stale lower value must not un-check a verse.
    if (sessionKey && learnedCount > (stored ?? 0)) patchSessionCheckpoint(sessionKey, LEARNED_VERSE_COUNT_FIELD, learnedCount);
  }, [sessionKey, learnedCount, stored, patchSessionCheckpoint]);
}
