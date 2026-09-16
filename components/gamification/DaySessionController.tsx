"use client";

import { useState } from "react";
import type { MemorizationDay, VerseSegment } from "@/types";
import { Button } from "@/components/ui/Button";
import { useProgressStore } from "@/store/useProgressStore";
import { useCelebration } from "@/lib/useCelebration";
import { applyDayCompletion } from "@/lib/completeDayEffects";
import { VerseLessonFlow } from "@/components/gamification/VerseLessonFlow";
import { ReviewSection } from "@/components/gamification/ReviewSection";
import { ReviewChain } from "@/components/drills/ReviewChain";
import { BossBattleStage } from "@/components/drills/BossBattleStage";
import { useChapterScopedReadingLayout } from "@/lib/useChapterScopedReadingLayout";
import { VictoryScreen } from "@/components/gamification/VictoryScreen";
import { StreakMilestoneModal } from "@/components/gamification/StreakMilestoneModal";
import { SectionCompleteOverlay } from "@/components/ui/SectionCompleteOverlay";
import { formatChapterLabel } from "@/lib/chapterContent";
import { FlaskConical } from "lucide-react";

interface DaySessionControllerProps {
  pathKey: string;
  label: string;
  day: MemorizationDay;
  // This whole path's own full day plan/completedDays/todaysDay (not scoped to just `day`
  // above) — threaded down to VerseLessonFlow/LearnSection so a Learn stage's own parchment
  // can lay out against the SAME real chapter pages/uniform font size the reading view itself
  // uses (see lib/useChapterReadingLayout.ts), not a smaller excerpt of its own.
  allDays: MemorizationDay[];
  completedDays: number;
  todaysDay: number;
  totalDays: number;
  // Book mode only: set by DayLoader when this day is the last "learn" day of its chapter —
  // that chapter's own verses, graduated straight into SRS the moment this lesson finishes.
  completingChapterVerses?: VerseSegment[];
  // Set only by PathOverviewScreen's own in-place lesson flow (the parchment view stays
  // mounted underneath — no route ever changes for "Start Lesson" anymore) — calling this
  // instead of navigating anywhere is what lets both the mid-lesson "Back" and the finished-
  // lesson screen return to that exact same parchment view rather than a different page.
  // Undefined for the standalone `/day/[dayNumber]` route (DayLoader.tsx), which still
  // navigates via pathHref below, unchanged.
  onExit?: () => void;
}

export function DaySessionController({ pathKey, label, day, allDays, completedDays, todaysDay, totalDays, completingChapterVerses, onExit }: DaySessionControllerProps) {
  const plan = useProgressStore((state) => state.paths[pathKey]);
  const clearSessionCheckpoint = useProgressStore((state) => state.clearSessionCheckpoint);
  const recordChapterReviewAccuracy = useProgressStore((state) => state.recordChapterReviewAccuracy);
  // Only actually used by the chapter_review/boss_battle/section_boss_battle branches below
  // (VerseLessonFlow computes its own for "learn" days) — called unconditionally regardless,
  // same as every other hook here, since hooks can't be called after an early return.
  const layout = useChapterScopedReadingLayout(allDays, day, completedDays, todaysDay);

  const [dayComplete, setDayComplete] = useState(false);
  const [milestoneStreak, setMilestoneStreak] = useState<number | null>(null);
  const { pending, celebrate, finish } = useCelebration();

  // Shared by every nested stage/verse/phase index within this one day's session — see
  // lib/useSessionCheckpoint.ts. Cleared once the day genuinely finishes so re-entering a
  // completed day later (e.g. via the "locked circles clickable for testing" path) starts
  // fresh rather than jumping to wherever it was left off.
  const sessionKey = `${pathKey}:${day.dayNumber}`;

  function finishDay() {
    clearSessionCheckpoint(sessionKey);
    const milestone = applyDayCompletion(pathKey, day, completingChapterVerses);
    if (milestone !== null) setMilestoneStreak(milestone);
    if (day.kind === "learn") {
      celebrate(() => setDayComplete(true), "Todays lesson complete");
    } else {
      setDayComplete(true);
    }
  }

  // The version query param is what the path overview page treats as the source of truth
  // (see app/path/[key]/page.tsx) — omitting it would default to KJV and silently overwrite
  // an already-selected translation via PathOverviewScreen's sync effect.
  const pathHref = `/path/${encodeURIComponent(pathKey)}${plan ? `?version=${encodeURIComponent(plan.version)}` : ""}`;
  const dayLabel = `Day ${day.dayNumber} of ${totalDays} — ${label}`;
  // The chapter-scoped title (e.g. "Titus 1") LearnSection's own top bar shows, matching how
  // the Path screen's own reading view titles itself — falls back to the path's own label
  // for the rare case a "learn" day somehow has no verses of its own.
  const learnLabel = day.newVerses[0] ? formatChapterLabel(day.newVerses[0].book, day.newVerses[0].chapter) : label;

  if (pending) {
    return <SectionCompleteOverlay text={pending.text} onDone={finish} />;
  }

  if (dayComplete) {
    if (day.kind === "boss_battle") {
      return <VictoryScreen label={label} />;
    }
    const completeHeading =
      day.kind === "learn"
        ? "Lesson complete!"
        : day.kind === "weekly_review"
          ? "Weekly review complete!"
          : day.kind === "monthly_review"
            ? "Monthly review complete!"
            : day.kind === "section_boss_battle"
              ? "Section boss battle complete!"
              : `Day ${day.dayNumber} complete!`;
    const continueLabel = day.kind === "section_boss_battle" ? "Continue" : "Back to path";
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-4 p-8 text-center">
        <h1 className="text-title text-brand-600">{completeHeading}</h1>
        {onExit ? (
          <button
            type="button"
            onClick={onExit}
            className="inline-block rounded-full bg-brand-500 px-6 py-3 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(107,86,68,0.18)] transition-colors hover:bg-brand-600"
          >
            {continueLabel}
          </button>
        ) : (
          <Button href={pathHref}>{continueLabel}</Button>
        )}
        <StreakMilestoneModal
          open={milestoneStreak !== null}
          streakCount={milestoneStreak ?? 0}
          onClose={() => setMilestoneStreak(null)}
        />
      </div>
    );
  }

  return (
    <>
      {/* Fixed, off to the side — never part of the normal document flow, so this testing
          shortcut can never be what's pushing a lesson's own parchment further down the
          screen (see LessonTopBar.tsx's own doc comment on that exact failure mode). */}
      <button
        type="button"
        onClick={finishDay}
        aria-label="Auto-complete lesson (testing)"
        title="Auto-complete lesson (testing)"
        className="fixed right-3 top-3 z-30 flex h-8 w-8 items-center justify-center rounded-full border border-dashed border-line bg-white/90 text-ink-muted shadow-sm hover:bg-mist dark:border-zinc-600 dark:bg-zinc-900/90 dark:text-zinc-400 dark:hover:bg-zinc-800"
      >
        <FlaskConical size={14} />
      </button>
      {day.kind === "learn" ? (
        <VerseLessonFlow
          day={day}
          allDays={allDays}
          completedDays={completedDays}
          todaysDay={todaysDay}
          label={learnLabel}
          version={plan?.version ?? ""}
          onComplete={finishDay}
          onExit={onExit}
          sessionKey={sessionKey}
        />
      ) : day.kind === "weekly_review" || day.kind === "monthly_review" ? (
        // ReviewSection renders its own complete chrome (LessonTopBar + width-capped wrapper)
        // whenever `layout` is set — see its own doc comment — so this branch, unlike the
        // ones below, is NOT nested inside the shared "tight column" wrapper; nesting it would
        // just double up the top label.
        <ReviewSection day={day} onComplete={finishDay} sessionKey={sessionKey} layout={layout} lessonLabel={learnLabel} version={plan?.version ?? ""} onExit={onExit} />
      ) : (
        // Tight column matching the Learn flow's own (see LearnSection.tsx) so the review page
        // fills exactly between this label and the drill's sticky dock with no document scroll.
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-3 px-4 pb-3 pt-3">
          <p className="text-caption text-ink-muted">{dayLabel}</p>
          {day.kind === "chapter_review" && (
            <ReviewChain
              verses={day.reviewVerses}
              onComplete={(accuracy) => {
                recordChapterReviewAccuracy(pathKey, accuracy);
                finishDay();
              }}
              layout={layout}
              restartOnMistake={false}
            />
          )}
          {(day.kind === "boss_battle" || day.kind === "section_boss_battle") && (
            <BossBattleStage
              verses={day.reviewVerses}
              mode={day.kind === "boss_battle" ? "fullWord" : "firstLetter"}
              lives={day.kind === "section_boss_battle" ? 20 : undefined}
              onComplete={finishDay}
              sessionKey={sessionKey}
              layout={layout}
            />
          )}
        </div>
      )}
    </>
  );
}
