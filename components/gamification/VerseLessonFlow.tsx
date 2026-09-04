"use client";

import type { MemorizationDay } from "@/types";
import { useCheckpointField } from "@/lib/useSessionCheckpoint";
import { ReviewSection } from "@/components/gamification/ReviewSection";
import { LearnSection } from "@/components/gamification/LearnSection";

interface VerseLessonFlowProps {
  day: MemorizationDay;
  onComplete: () => void;
  sessionKey?: string;
}

const PHASES = ["previousReview", "learn", "postReview"] as const;
type Phase = (typeof PHASES)[number];

// A single verse lesson: first a quick check of just the immediately preceding lesson's
// verse(s) — every path kind, not just book mode — then learn this verse (which itself
// folds a growing typed check of everything learned TODAY so far right after each verse's
// own speak-it-aloud stage — see LearnSection.tsx's type_cumulative_today), then (book mode
// only) the sliding-window chapter review. There's no separate generic "review everything so
// far" phase here anymore — it read as a confusing, oddly-scoped extra stage in book mode
// (where day.reviewVerses is deliberately empty, see lib/bookDayPlan.ts) squeezed between
// Learn and the real Chapter Review; the per-verse checks inside Learn cover that same ground
// in the place it actually belongs.
export function VerseLessonFlow({ day, onComplete, sessionKey }: VerseLessonFlowProps) {
  const [phaseIndex, setPhaseIndex] = useCheckpointField(sessionKey, "phaseIndex", 0);
  const phase: Phase = PHASES[phaseIndex];
  const hasPreviousReview = (day.previousVerses?.length ?? 0) > 0;
  const hasPostReview = day.postLearnReviewStages?.some((stage) => stage.verses.length > 0) ?? false;

  // Skip straight past the previous-lesson check when there's nothing to show for it (a
  // path's very first lesson) — adjusting phaseIndex here, during render, is the same
  // "resetting state when inputs change" pattern used in MasteryTrack.tsx; the condition
  // goes false on the very next render (phase becomes "learn"), so it can't loop.
  if (phase === "previousReview" && !hasPreviousReview) {
    setPhaseIndex(1);
    return null;
  }

  if (phase === "previousReview") {
    return <ReviewSection day={day} onComplete={() => setPhaseIndex(1)} sessionKey={sessionKey} phase="previous" />;
  }

  if (phase === "learn") {
    return <LearnSection day={day} onComplete={() => (hasPostReview ? setPhaseIndex(2) : onComplete())} sessionKey={sessionKey} />;
  }

  return <ReviewSection day={day} onComplete={onComplete} sessionKey={sessionKey} phase="post" />;
}
