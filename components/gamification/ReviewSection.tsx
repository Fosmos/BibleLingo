"use client";

import { useEffect } from "react";
import type { MemorizationDay, ReviewStage } from "@/types";
import { useCheckpointField } from "@/lib/useSessionCheckpoint";
import { useCelebration } from "@/lib/useCelebration";
import { ReviewChain } from "@/components/drills/ReviewChain";
import { SectionCompleteOverlay } from "@/components/ui/SectionCompleteOverlay";

interface StageWithCelebration extends ReviewStage {
  celebrationText: string;
}

interface ReviewSectionProps {
  day: MemorizationDay;
  onComplete: () => void;
  sessionKey?: string;
  // "previous" runs just the immediately preceding learn day's verses — a quick,
  // recent-focused check that comes first in the lesson, across every path kind. "pre"
  // (default) runs day.reviewVerses as a single "Review" stage — VerseLessonFlow itself
  // never reaches this phase for a "learn" day anymore (see its own doc comment); the only
  // caller left is DaySessionController.tsx's weekly_review/monthly_review days, which have
  // no newVerses of their own anyway. "post" runs book mode's postLearnReviewStages instead
  // — see MemorizationDay.postLearnReviewStages.
  phase?: "previous" | "pre" | "post";
}

export function ReviewSection({ day, onComplete, sessionKey, phase = "pre" }: ReviewSectionProps) {
  let stages: StageWithCelebration[];
  if (phase === "previous") {
    const previousVerses = day.previousVerses ?? [];
    stages =
      previousVerses.length > 0
        ? [{ label: "Previous Verses", verses: previousVerses, celebrationText: "Previous verses reviewed" }]
        : [];
  } else if (phase === "post") {
    const chapterStages = day.postLearnReviewStages?.filter((stage) => stage.verses.length > 0) ?? [];
    stages = chapterStages.map((stage) => ({ ...stage, celebrationText: "Previous chapter reviewed" }));
  } else {
    const preStages = day.reviewVerses.length > 0 ? [{ label: "Review", verses: day.reviewVerses }] : [];
    stages = preStages.map((stage) => ({ ...stage, celebrationText: "Previous verses reviewed" }));
  }

  const [stageIndex, setStageIndex] = useCheckpointField(sessionKey, `reviewStageIndex:${phase}`, 0);
  const { pending, celebrate, finish } = useCelebration();

  // Nothing to review (e.g. a path's very first lesson) skips straight past this section
  // instead of showing a placeholder the user has to click through — same "no stage the user
  // can't act on" principle as VerseLessonFlow's own previousReview skip just above it.
  // Depends on stages.length rather than running mount-only: VerseLessonFlow renders this
  // component at the same tree position for both its "previousReview" and "postReview"
  // phases, so React reuses the same instance across phases instead of remounting — a
  // mount-only effect would only ever see the FIRST phase's stage count and never re-check a
  // later phase's.
  useEffect(() => {
    if (stages.length === 0) onComplete();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stages.length]);

  if (pending) {
    return <SectionCompleteOverlay text={pending.text} onDone={finish} />;
  }

  if (stages.length === 0) return null;

  const stage = stages[stageIndex];
  const label = stages.length > 1 ? `${stage.label} (${stageIndex + 1} of ${stages.length})` : stage.label;

  function handleStageComplete() {
    const next = stageIndex + 1;
    if (next >= stages.length) {
      celebrate(onComplete, stage.celebrationText);
    } else {
      celebrate(() => setStageIndex(next), stage.celebrationText);
    }
  }

  return <ReviewChain key={stageIndex} label={label} verses={stage.verses} onComplete={handleStageComplete} />;
}
