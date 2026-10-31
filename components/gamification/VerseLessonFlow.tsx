"use client";

import { useMemo } from "react";
import type { MemorizationDay } from "@/types";
import { useCheckpointField } from "@/lib/useSessionCheckpoint";
import { useChapterScopedReadingLayout } from "@/lib/useChapterScopedReadingLayout";
import { useEmbeddedSenseCardOverride } from "@/lib/useEmbeddedSenseCardOverride";
import { usePriorLearnedVerses } from "@/lib/usePriorLearnedVerse";
import { usePericopesReady } from "@/lib/usePericopesReady";
import { getChapterVerses } from "@/lib/chapterContent";
import { getCachedPericopes } from "@/lib/pericopeCache";
import { lessonPairVerses, lessonReviewVerses } from "@/lib/lessonReview";
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

const PHASES = ["learn", "finalReview"] as const;

// A single verse lesson: learn the verse, review it with the verse just before it, then with the verses
// before it — the last five, or on every fifth verse the block so far (lib/lessonReview.ts; every path
// kind). Nothing after.
export function VerseLessonFlow({ day, allDays, completedDays, todaysDay, label, version, onComplete, onExit, sessionKey, embeddedInMindMap }: VerseLessonFlowProps) {
  // Its own checkpoint key: a lesson saved under the old order (review first) starts over cleanly.
  const [phaseIndex, setPhaseIndex] = useCheckpointField(sessionKey, "lessonPhase", 0);
  const phase = PHASES[phaseIndex] ?? PHASES[0];
  // The closing review. A chapter's pericopes (where a long one's blocks break) can load after the
  // lesson opens — one started straight from the map — and the review is worked out again when they do.
  const prior = usePriorLearnedVerses(day, allDays);
  const learned = useMemo(() => day.newVerses.filter((verse) => verse.text.trim().length > 0), [day.newVerses]);
  const pericopesReady = usePericopesReady(day.newVerses);
  const first = learned[0];
  const pericopes = pericopesReady && first ? getCachedPericopes(first.book, first.chapter) : undefined;
  const reviewDay = useMemo(() => {
    const chapterLength = first ? (getChapterVerses(first.book, first.chapter)?.length ?? first.verseNumber) : 0;
    return { ...day, previousVerses: lessonReviewVerses(prior, learned, chapterLength, (pericopes ?? []).map((pericope) => pericope.startVerse)) };
  }, [day, prior, learned, first, pericopes]);
  const pairVerses = useMemo(() => lessonPairVerses(prior, learned, reviewDay.previousVerses), [prior, learned, reviewDay]);
  // Only used by the review below (LearnSection computes its own for "learn") — called
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

  return (
    <ReviewSection
      day={reviewDay}
      onComplete={onComplete}
      sessionKey={sessionKey}
      phase="final"
      pairVerses={pairVerses}
      layout={layout}
      lessonLabel={label}
      version={version}
      onExit={onExit}
      embeddedInMindMap={embeddedInMindMap}
    />
  );
}
