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

const PHASES = ["previousReview", "review", "learn", "postReview"] as const;
type Phase = (typeof PHASES)[number];

// A single verse lesson: first a quick check of just the immediately preceding lesson's
// verse(s) — every path kind, not just book mode — then review everything learned so far,
// learn this verse, then (book mode only) the sliding-window chapter review. The chapter
// review still runs last so review of already-known material never stands between the
// user and the new verse they came here to learn.
export function VerseLessonFlow({ day, onComplete, sessionKey }: VerseLessonFlowProps) {
  const [phaseIndex, setPhaseIndex] = useCheckpointField(sessionKey, "phaseIndex", 0);
  const phase: Phase = PHASES[phaseIndex];
  const hasPreviousReview = (day.previousVerses?.length ?? 0) > 0;
  const hasPostReview = day.postLearnReviewStages?.some((stage) => stage.verses.length > 0) ?? false;

  // Skip straight past the previous-lesson check when there's nothing to show for it (a
  // path's very first lesson) — adjusting phaseIndex here, during render, is the same
  // "resetting state when inputs change" pattern used in MasteryTrack.tsx; the condition
  // goes false on the very next render (phase becomes "review"), so it can't loop.
  if (phase === "previousReview" && !hasPreviousReview) {
    setPhaseIndex(1);
    return null;
  }

  if (phase === "previousReview") {
    return <ReviewSection day={day} onComplete={() => setPhaseIndex(1)} sessionKey={sessionKey} phase="previous" />;
  }

  if (phase === "review") {
    return <ReviewSection day={day} onComplete={() => setPhaseIndex(2)} sessionKey={sessionKey} />;
  }

  if (phase === "learn") {
    return (
      <LearnSection
        day={day}
        onComplete={() => (hasPostReview ? setPhaseIndex(3) : onComplete())}
        sessionKey={sessionKey}
      />
    );
  }

  return <ReviewSection day={day} onComplete={onComplete} sessionKey={sessionKey} phase="post" />;
}
