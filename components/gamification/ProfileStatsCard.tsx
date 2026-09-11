"use client";

import { Flame } from "lucide-react";
import { useProgressStore } from "@/store/useProgressStore";
import { StreakCounter } from "@/components/gamification/StreakCounter";
import { StreakFreezeBadge } from "@/components/gamification/StreakFreezeBadge";
import { ShekelCounter } from "@/components/gamification/ShekelCounter";

// Split out of app/profile/page.tsx purely to keep that file under this codebase's 200-line
// cap. The at-a-glance numbers row — current streak, longest streak, shekels.
export function ProfileStatsCard() {
  const longestStreak = useProgressStore((state) => state.streak.longestStreak);

  return (
    <div className="rounded-2xl bg-brand-50 p-5 shadow-sm dark:border dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-500 text-white">
          <Flame size={15} />
        </span>
        <p className="text-caption font-semibold uppercase tracking-wide text-brand-500">Stats</p>
      </div>
      <div className="mt-4 flex items-center justify-between gap-2">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-ink-muted">Current streak</span>
          <div className="flex items-center gap-2">
            <StreakCounter showInfo />
            <StreakFreezeBadge showInfo />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-ink-muted">Longest streak</span>
          <span className="font-serif text-sm font-semibold text-ink dark:text-zinc-100">{longestStreak} days</span>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-ink-muted">Shekels</span>
          <ShekelCounter showInfo />
        </div>
      </div>
    </div>
  );
}
