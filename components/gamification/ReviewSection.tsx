"use client";

import { motion } from "framer-motion";
import type { MemorizationDay, ReviewStage } from "@/types";
import { useCheckpointField } from "@/lib/useSessionCheckpoint";
import { useCelebration } from "@/lib/useCelebration";
import { ReviewChain } from "@/components/drills/ReviewChain";
import { SectionCompleteOverlay } from "@/components/ui/SectionCompleteOverlay";
import { TAP_SCALE } from "@/lib/motionTokens";

interface StageWithCelebration extends ReviewStage {
  celebrationText: string;
}

interface ReviewSectionProps {
  day: MemorizationDay;
  onComplete: () => void;
  sessionKey?: string;
  // "previous" runs just the immediately preceding learn day's verses — a quick,
  // recent-focused check that comes first in the lesson, across every path kind. "pre"
  // (default) runs day.reviewStages before the new verse, same as every other path kind's
  // single "Review" stage. "post" runs book mode's postLearnReviewStages instead, after
  // the new verse has been learned — see MemorizationDay.postLearnReviewStages.
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
    const preStages =
      day.reviewStages?.filter((stage) => stage.verses.length > 0) ??
      (day.reviewVerses.length > 0 ? [{ label: "Review", verses: day.reviewVerses }] : []);
    stages = preStages.map((stage) => ({ ...stage, celebrationText: "Previous verses reviewed" }));
  }

  const [stageIndex, setStageIndex] = useCheckpointField(sessionKey, `reviewStageIndex:${phase}`, 0);
  const { pending, celebrate, finish } = useCelebration();

  if (pending) {
    return <SectionCompleteOverlay text={pending.text} onDone={finish} />;
  }

  if (stages.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <p className="text-caption font-semibold uppercase tracking-wide text-brand-500">Review</p>
        <p className="text-ink-muted">Nothing to review yet — this is your first day on this chapter.</p>
        <motion.button
          type="button"
          whileTap={TAP_SCALE}
          onClick={onComplete}
          className="rounded-full bg-brand-500 px-6 py-2 text-sm font-semibold text-white"
        >
          Continue
        </motion.button>
      </div>
    );
  }

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
