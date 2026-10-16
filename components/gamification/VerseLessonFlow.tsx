"use client";

import { useMemo } from "react";
import type { MemorizationDay } from "@/types";
import { useCheckpointField } from "@/lib/useSessionCheckpoint";
import { useChapterScopedReadingLayout } from "@/lib/useChapterScopedReadingLayout";
import { useEmbeddedSenseCardOverride } from "@/lib/useEmbeddedSenseCardOverride";
import { usePriorLearnedVerses } from "@/lib/usePriorLearnedVerse";
import { ReviewSection } from "@/components/gamification/ReviewSection";
import { LearnSection } from "@/components/gamification/LearnSection";

interface VerseLessonFlowProps {
  day: MemorizationDay;
  // See DaySessionController.tsx's own doc comment — this whole path's own full day
  // plan/completedDays/todaysDay, threaded straight through to LearnSection.
  allDays: MemorizationDay[];
  completedDays: number;
  todaysDay: number;
  label: string;
  version: string;
  onComplete: () => void;
  // See DaySessionController.tsx's own doc comment — set only by the in-place lesson flow.
  onExit?: () => void;
  sessionKey?: string;
  // See InPlaceLessonSession.tsx's own doc comment — threaded straight through to LearnSection.
  embeddedInMindMap?: boolean;
}

const PHASES = ["learn", "finalReview", "postReview"] as const;

// A single verse lesson: learn the verse, then review it together with up to the 4 learned verses
// just before it (every path kind), then (book mode only) the sliding-window chapter review.
export function VerseLessonFlow({ day, allDays, completedDays, todaysDay, label, version, onComplete, onExit, sessionKey, embeddedInMindMap }: VerseLessonFlowProps) {
  // Its own checkpoint key: a lesson saved under the old order (review first) starts over cleanly.
  const [phaseIndex, setPhaseIndex] = useCheckpointField(sessionKey, "lessonPhase", 0);
  const phase = PHASES[phaseIndex] ?? PHASES[0];
  // The closing review: the verses before this lesson's (learning 8:9, it reviews 8:5–8) and then
  // the lesson's own verses, typed through in order.
  const prior = usePriorLearnedVerses(day);
  const reviewDay = useMemo(() => ({ ...day, previousVerses: [...prior, ...day.newVerses.filter((verse) => verse.text.trim().length > 0)] }), [day, prior]);
  const hasPostReview = day.postLearnReviewStages?.some((stage) => stage.verses.length > 0) ?? false;
  const finishReview = () => (hasPostReview ? setPhaseIndex(2) : onComplete());
  // Only used by the review branches below (LearnSection computes its own for "learn") — called
  // unconditionally regardless, since hooks can't be called after an early return.
  const [senseCardFillHeightPx, senseCardColumnWidthPx] = useEmbeddedSenseCardOverride(embeddedInMindMap);
  const layout = useChapterScopedReadingLayout(allDays, day, completedDays, todaysDay, senseCardFillHeightPx, senseCardColumnWidthPx);

  if (phase === "learn") {
    return (
      <LearnSection
        day={day}
        allDays={allDays}
        completedDays={completedDays}
        todaysDay={todaysDay}
        label={label}
        version={version}
        onComplete={() => setPhaseIndex(1)}
        onExit={onExit}
        sessionKey={sessionKey}
        embeddedInMindMap={embeddedInMindMap}
      />
    );
  }

  if (phase === "finalReview") {
    return (
      <ReviewSection
        key="final"
        day={reviewDay}
        onComplete={finishReview}
        sessionKey={sessionKey}
        phase="final"
        layout={layout}
        lessonLabel={label}
        version={version}
        onExit={onExit}
        embeddedInMindMap={embeddedInMindMap}
      />
    );
  }

  return (
    <ReviewSection
      key="post"
      day={day}
      onComplete={onComplete}
      sessionKey={sessionKey}
      phase="post"
      layout={layout}
      lessonLabel={label}
      version={version}
      onExit={onExit}
      embeddedInMindMap={embeddedInMindMap}
    />
  );
}
