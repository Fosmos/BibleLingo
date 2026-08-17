"use client";

import { Snowflake } from "lucide-react";
import { useProgressStore } from "@/store/useProgressStore";
import { InfoTip } from "@/components/ui/InfoTip";
import { INFO_TIPS } from "@/lib/infoTipCopy";

interface StreakFreezeBadgeProps {
  className?: string;
  showInfo?: boolean;
  // See StreakCounter's `pill` prop — same soft-chip treatment for standalone HUD contexts.
  pill?: boolean;
}

export function StreakFreezeBadge({ className, showInfo, pill }: StreakFreezeBadgeProps) {
  const inventory = useProgressStore((state) => state.streak.freeze.inventory);

  if (inventory <= 0) {
    return null;
  }

  return (
    <div
      className={`flex items-center gap-1 ${pill ? "rounded-full bg-mist px-3 py-1.5 dark:bg-zinc-800" : ""} ${className ?? ""}`}
      aria-label={`${inventory} streak freeze${inventory === 1 ? "" : "s"} available`}
    >
      <Snowflake size={16} className="text-brand-400" />
      <span className="text-caption font-semibold text-ink-muted">{inventory}</span>
      {showInfo && <InfoTip text={INFO_TIPS.streakFreezeBadge} />}
    </div>
  );
}
