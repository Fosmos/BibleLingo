"use client";

import { useEffect } from "react";
import type { MemorizationDay } from "@/types";
import { useCheckpointField } from "@/lib/useSessionCheckpoint";
import { useChapterScopedReadingLayout } from "@/lib/useChapterScopedReadingLayout";
import { useEmbeddedSenseCardOverride } from "@/lib/useEmbeddedSenseCardOverride";
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
export function VerseLessonFlow({ day, allDays, completedDays, todaysDay, label, version, onComplete, onExit, sessionKey, embeddedInMindMap }: VerseLessonFlowProps) {
  const [phaseIndex, setPhaseIndex] = useCheckpointField(sessionKey, "phaseIndex", 0);
  const hasPreviousReview = (day.previousVerses?.length ?? 0) > 0;
  // Skip straight past the previous-lesson check when there's nothing to show for it (a path's
  // very first lesson): shown as "learn" at once, and saved as such just after rendering —
  // saving it during render updated the store mid-render (React's setState-in-render warning).
  const skipPrevious = PHASES[phaseIndex] === "previousReview" && !hasPreviousReview;
  const phase: Phase = skipPrevious ? PHASES[1] : PHASES[phaseIndex];
  useEffect(() => {
    if (skipPrevious) setPhaseIndex(1);
  }, [skipPrevious, setPhaseIndex]);
  const hasPostReview = day.postLearnReviewStages?.some((stage) => stage.verses.length > 0) ?? false;
  // Only actually used by the previousReview/postReview branches below (LearnSection computes
  // its own for "learn") — called unconditionally regardless, same as every other hook here,
  // since hooks can't be called after an early return.
  const [senseCardFillHeightPx, senseCardColumnWidthPx] = useEmbeddedSenseCardOverride(embeddedInMindMap);
  const layout = useChapterScopedReadingLayout(allDays, day, completedDays, todaysDay, senseCardFillHeightPx, senseCardColumnWidthPx);

  if (phase === "previousReview") {
    return (
      <ReviewSection
        day={day}
        onComplete={() => setPhaseIndex(1)}
        sessionKey={sessionKey}
        phase="previous"
        layout={layout}
        lessonLabel={label}
        version={version}
        onExit={onExit}
        embeddedInMindMap={embeddedInMindMap}
      />
    );
  }

  if (phase === "learn") {
    return (
      <LearnSection
        day={day}
        allDays={allDays}
        completedDays={completedDays}
        todaysDay={todaysDay}
        label={label}
        version={version}
        onComplete={() => (hasPostReview ? setPhaseIndex(2) : onComplete())}
        onExit={onExit}
        sessionKey={sessionKey}
        embeddedInMindMap={embeddedInMindMap}
      />
    );
  }

  return (
    <ReviewSection
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
