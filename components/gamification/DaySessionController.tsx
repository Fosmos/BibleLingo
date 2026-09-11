"use client";

import { useState } from "react";
import type { MemorizationDay, VerseSegment } from "@/types";
import { Button } from "@/components/ui/Button";
import { useProgressStore } from "@/store/useProgressStore";
import { useCelebration } from "@/lib/useCelebration";
import { VerseLessonFlow } from "@/components/gamification/VerseLessonFlow";
import { ReviewSection } from "@/components/gamification/ReviewSection";
import { ReviewChain } from "@/components/drills/ReviewChain";
import { BossBattleStage } from "@/components/drills/BossBattleStage";
import { VictoryScreen } from "@/components/gamification/VictoryScreen";
import { StreakMilestoneModal } from "@/components/gamification/StreakMilestoneModal";
import { SectionCompleteOverlay } from "@/components/ui/SectionCompleteOverlay";
import { STREAK_MILESTONES } from "@/lib/streak";
import { playStreakSfx } from "@/lib/audio";
import { SHEKELS_PER_VERSE_COMPLETED, SHEKELS_PER_BOSS_BATTLE } from "@/lib/economy";

interface DaySessionControllerProps {
  pathKey: string;
  label: string;
  day: MemorizationDay;
  totalDays: number;
  // Book mode only: set by DayLoader when this day is the last "learn" day of its chapter —
  // that chapter's own verses, graduated straight into SRS the moment this lesson finishes.
  completingChapterVerses?: VerseSegment[];
}

export function DaySessionController({ pathKey, label, day, totalDays, completingChapterVerses }: DaySessionControllerProps) {
  const plan = useProgressStore((state) => state.paths[pathKey]);
  const completeDay = useProgressStore((state) => state.completeDay);
  const completeBookChapter = useProgressStore((state) => state.completeBookChapter);
  const incrementStreak = useProgressStore((state) => state.incrementStreak);
  const addStreakFreeze = useProgressStore((state) => state.addStreakFreeze);
  const awardSticker = useProgressStore((state) => state.awardSticker);
  const earnShekels = useProgressStore((state) => state.earnShekels);
  const clearSessionCheckpoint = useProgressStore((state) => state.clearSessionCheckpoint);
  const recordChapterReviewAccuracy = useProgressStore((state) => state.recordChapterReviewAccuracy);

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
    completeDay(pathKey, day.dayNumber);
    if (completingChapterVerses && completingChapterVerses.length > 0 && plan) {
      completeBookChapter(completingChapterVerses, plan.version);
    }
    const previousStreak = useProgressStore.getState().streak.currentStreak;
    incrementStreak();
    const newStreak = useProgressStore.getState().streak.currentStreak;
    if (newStreak !== previousStreak) {
      playStreakSfx();
      if (STREAK_MILESTONES.includes(newStreak)) {
        addStreakFreeze(1);
        setMilestoneStreak(newStreak);
      }
    }
    if (day.newVerses.length > 0) {
      earnShekels(day.newVerses.length * SHEKELS_PER_VERSE_COMPLETED);
    }
    if (day.kind === "boss_battle" || day.kind === "section_boss_battle") {
      earnShekels(SHEKELS_PER_BOSS_BATTLE);
    }
    if (day.kind === "boss_battle") {
      awardSticker(pathKey);
    }
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
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-4 p-8 text-center">
        <h1 className="text-title text-brand-600">{completeHeading}</h1>
        <Button href={pathHref}>{day.kind === "section_boss_battle" ? "Continue" : "Back to path"}</Button>
        <StreakMilestoneModal
          open={milestoneStreak !== null}
          streakCount={milestoneStreak ?? 0}
          onClose={() => setMilestoneStreak(null)}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-6">
      {day.kind !== "learn" && <p className="text-caption text-ink-muted">{dayLabel}</p>}
      {day.kind === "learn" && (
        <VerseLessonFlow day={day} onComplete={finishDay} sessionKey={sessionKey} />
      )}
      {day.kind === "chapter_review" && (
        <ReviewChain
          verses={day.reviewVerses}
          onComplete={(accuracy) => {
            recordChapterReviewAccuracy(pathKey, accuracy);
            finishDay();
          }}
        />
      )}
      {(day.kind === "boss_battle" || day.kind === "section_boss_battle") && (
        <BossBattleStage
          verses={day.reviewVerses}
          mode={day.kind === "boss_battle" ? "fullWord" : "firstLetter"}
          lives={day.kind === "section_boss_battle" ? 20 : undefined}
          onComplete={finishDay}
          sessionKey={sessionKey}
        />
      )}
      {(day.kind === "weekly_review" || day.kind === "monthly_review") && (
        <ReviewSection day={day} onComplete={finishDay} sessionKey={sessionKey} />
      )}
    </div>
  );
}
