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
      className={`flex items-center gap-1 ${pill ? "rounded-full bg-crack-50 px-3 py-1.5 dark:bg-zinc-800" : ""} ${className ?? ""}`}
      aria-label="Current streak"
    >
      <Flame
        size={pill ? 16 : 20}
        className={currentStreak > 0 ? "fill-gold-500 text-gold-500" : "text-ink-muted dark:text-zinc-700"}
      />
      <span className="text-sm font-semibold text-ink-soft dark:text-zinc-300">{currentStreak}</span>
      {showInfo && <InfoTip text={INFO_TIPS.streakCounter} />}
    </div>
  );
}
