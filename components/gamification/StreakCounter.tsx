"use client";

import { Flame } from "lucide-react";
import { useProgressStore } from "@/store/useProgressStore";
import { InfoTip } from "@/components/ui/InfoTip";
import { INFO_TIPS } from "@/lib/infoTipCopy";

interface StreakCounterProps {
  className?: string;
  showInfo?: boolean;
  // Wraps the counter in a soft rounded chip (warm-tinted background) instead of bare
  // icon+number — used wherever it reads as a standalone HUD element (Home header, the
  // in-lesson top bar) rather than inside a card that already has its own label/border.
  pill?: boolean;
}

export function StreakCounter({ className, showInfo, pill }: StreakCounterProps) {
  const currentStreak = useProgressStore((state) => state.streak.currentStreak);

  return (
    <div
      className={`flex items-center gap-1 ${pill ? "rounded-full bg-brand-100 px-[13px] py-2 text-brand-700 dark:bg-zinc-800" : ""} ${className ?? ""}`}
      aria-label="Current streak"
    >
      <Flame
        size={pill ? 17 : 20}
        strokeWidth={2.75}
        className={currentStreak > 0 ? "fill-brand-400 text-brand-700" : "text-ink-muted dark:text-zinc-700"}
      />
      <span className={`font-bold ${pill ? "text-[15px] text-brand-700" : "text-sm text-ink-soft"} dark:text-zinc-300`}>{currentStreak}</span>
      {showInfo && <InfoTip text={INFO_TIPS.streakCounter} />}
    </div>
  );
}
