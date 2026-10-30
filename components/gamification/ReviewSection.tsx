"use client";

import { useEffect } from "react";
import type { MemorizationDay, ReviewStage, VerseSegment } from "@/types";
import { useCheckpointField } from "@/lib/useSessionCheckpoint";
import { useCelebration } from "@/lib/useCelebration";
import { useReportFocusVerse } from "@/lib/useReportFocusVerse";
import { useReportSheetStage } from "@/lib/useReportSheetStage";
import { formatVerseRangeLabel } from "@/lib/chapterContent";
import type { ChapterReadingLayout } from "@/lib/useChapterReadingLayout";
import { ReviewChain } from "@/components/drills/ReviewChain";
import { LessonChrome } from "@/components/gamification/LessonChrome";
import { SectionCompleteOverlay } from "@/components/ui/SectionCompleteOverlay";

interface StageWithCelebration extends ReviewStage {
  celebrationText: string;
}

interface ReviewSectionProps {
  day: MemorizationDay;
  onComplete: () => void;
  sessionKey?: string;
  // "final" runs day.previousVerses — the verse just learned and its chapter's verses before it — as the
  // lesson's closing "Review", across every path kind (VerseLessonFlow.tsx). "pre"
  // (default) runs day.reviewVerses as a single "Review" stage — VerseLessonFlow itself
  // never reaches this phase for a "learn" day anymore (see its own doc comment); the only
  // caller left is DaySessionController.tsx's weekly_review/monthly_review days, which have
  // no newVerses of their own anyway.
  phase?: "final" | "pre";
  // "final" only: the verse before the lesson's and the lesson's own, reviewed first, before
  // the whole run (VerseLessonFlow.tsx). Unset when that's no shorter than the whole run.
  pairVerses?: VerseSegment[];
  // The reading view's own real page layout (see lib/useChapterScopedReadingLayout.ts) — set
  // by every caller that has one (VerseLessonFlow.tsx/DaySessionController.tsx), rendering
  // this phase's own verses on the SAME real reading-view page(s) browsing shows, blanking
  // only the verse being reviewed instead of a smaller custom-built excerpt.
  layout?: ChapterReadingLayout;
  // The chapter-scoped title (e.g. "Mark 2") and translation LessonTopBar shows — only
  // actually needed (and rendered) alongside `layout`, so this section can be a complete,
  // self-chromed screen on its own — see LessonChrome.tsx's own doc comment. Without `layout`
  // there's no reading-view page to match chrome height against in the first place, so the
  // standalone `ReviewChain` fallback stays caption-only, same as it always has.
  lessonLabel?: string;
  version?: string;
  // See DaySessionController.tsx's own doc comment — set only by the in-place lesson flow.
  onExit?: () => void;
  // See LessonChrome.tsx's own doc comment — threaded straight through to its own call below.
  embeddedInMindMap?: boolean;
}

export function ReviewSection({ day, onComplete, sessionKey, phase = "pre", pairVerses, layout, lessonLabel, version, onExit, embeddedInMindMap }: ReviewSectionProps) {
  let stages: StageWithCelebration[];
  if (phase === "final") {
    const verses = day.previousVerses ?? [];
    const pair = pairVerses && pairVerses.length > 0 ? [{ label: "Review", verses: pairVerses, celebrationText: "Last verse reviewed" }] : [];
    stages = verses.length > 0 ? [...pair, { label: "Review", verses, celebrationText: "Verses reviewed" }] : [];
  } else {
    const preStages = day.reviewVerses.length > 0 ? [{ label: "Review", verses: day.reviewVerses }] : [];
    stages = preStages.map((stage) => ({ ...stage, celebrationText: "Previous verses reviewed" }));
  }

  const [stageIndex, setStageIndex] = useCheckpointField(sessionKey, `reviewStageIndex:${phase}`, 0);
  const { pending, celebrate, finish } = useCelebration();
  const reportVerse = useReportFocusVerse(embeddedInMindMap);
  const shownStage = stages[stageIndex];
  useReportSheetStage(
    shownStage ? { label: shownStage.label, reference: formatVerseRangeLabel(shownStage.verses), step: stageIndex, steps: stages.length } : null,
    embeddedInMindMap,
  );

  // Nothing to review (e.g. a path's very first lesson) skips straight past this section
  // instead of showing a placeholder the user has to click through — same "no stage the user
  // can't act on" principle. Keyed on stages.length, so it re-checks if the stages change.
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

  if (!layout) {
    return <ReviewChain key={stageIndex} label={label} verses={stage.verses} onComplete={handleStageComplete} restartOnMistake={false} />;
  }

  // A complete, self-chromed screen — same LessonTopBar + fixed reading-view parchment every
  // Learn stage renders (see LessonChrome.tsx/LessonPageCard.tsx), not a bare, unconstrained
  // `ReviewChain` growing to the full viewport width: this section is rendered as a caller's
  // own screen root (VerseLessonFlow.tsx's "finalReview" phase), the same way
  // LearnSection.tsx renders its own {topBar} + width-capped wrapper, rather than being handed
  // one by a parent. The goal is the same verse text landing in the exact same spot on the
  // page every time a reader sees it — recognizing it there is part of what memorization
  // through this app leans on.
  return (
    <>
      <LessonChrome
        label={lessonLabel ?? ""}
        version={version ?? ""}
        current={stageIndex + 1}
        total={stages.length}
        onExit={onExit}
        layout={layout}
        embeddedInMindMap={embeddedInMindMap}
      />
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-3 px-4 pt-3">
        <ReviewChain key={stageIndex} label={label} verses={stage.verses} onComplete={handleStageComplete} layout={layout} restartOnMistake={false} onVerseChange={reportVerse} />
      </div>
    </>
  );
}
