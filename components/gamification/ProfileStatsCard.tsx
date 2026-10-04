"use client";

import type { ReactNode } from "react";
import { Coins, Flame, Snowflake } from "lucide-react";
import { useProgressStore } from "@/store/useProgressStore";
import { InfoTip } from "@/components/ui/InfoTip";
import { INFO_TIPS } from "@/lib/infoTipCopy";

interface StatCardProps {
  label: string;
  info?: string;
  className: string;
  labelClassName: string;
  children: ReactNode;
}

function StatCard({ label, info, className, labelClassName, children }: StatCardProps) {
  return (
    <div className={`flex min-w-0 flex-col gap-1.5 rounded-organic px-3 py-3.5 ${className}`}>
      <span className={`flex items-center gap-1 text-xs font-semibold ${labelClassName}`}>
        {label} {info && <InfoTip text={info} />}
      </span>
      {children}
    </div>
  );
}

// Split out of app/profile/page.tsx to keep it under the 200-line cap. The at-a-glance numbers
// (the Organic restyle): current streak with its freezes, longest streak, shekels.
export function ProfileStatsCard() {
  const currentStreak = useProgressStore((state) => state.streak.currentStreak);
  const longestStreak = useProgressStore((state) => state.streak.longestStreak);
  const freezes = useProgressStore((state) => state.streak.freeze.inventory);
  const shekels = useProgressStore((state) => state.shekels);

  return (
    <div className="grid grid-cols-3 gap-2">
      <StatCard
        label="Current streak"
        className="bg-brand-100 dark:bg-zinc-900"
        labelClassName="text-brand-800 dark:text-brand-300"
      >
        <span className="flex items-center gap-1">
          <Flame size={18} strokeWidth={2.75} className={currentStreak > 0 ? "fill-brand-400 text-brand-700" : "text-ink-muted"} />
          <span className="font-heading text-[22px] leading-none text-ink dark:text-zinc-100">{currentStreak}</span>
        </span>
        {freezes > 0 && (
          <span className="flex items-center gap-1 text-xs text-ink-muted">
            <Snowflake size={12} strokeWidth={2.75} />
            {freezes} freeze{freezes === 1 ? "" : "s"}
          </span>
        )}
      </StatCard>
      <StatCard label="Longest streak" className="bg-sand-100 dark:bg-zinc-900" labelClassName="text-ink-muted">
        <span className="font-heading text-[22px] leading-none text-ink dark:text-zinc-100">
          {longestStreak} {longestStreak === 1 ? "day" : "days"}
        </span>
      </StatCard>
      <StatCard label="Shekels" info={INFO_TIPS.shekelCounter} className="bg-sand-100 dark:bg-zinc-900" labelClassName="text-ink-muted">
        <span className="flex items-center gap-1">
          <Coins size={18} strokeWidth={2.75} className="text-brand-600" />
          <span className="font-heading text-[22px] leading-none text-ink dark:text-zinc-100">{shekels.toLocaleString()}</span>
        </span>
      </StatCard>
    </div>
  );
}
