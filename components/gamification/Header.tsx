"use client";

import { StreakCounter } from "@/components/gamification/StreakCounter";
import { StreakFreezeBadge } from "@/components/gamification/StreakFreezeBadge";
import { ShekelCounter } from "@/components/gamification/ShekelCounter";

interface HeaderProps {
  className?: string;
}

export function Header({ className }: HeaderProps) {
  return (
    <div
      className={`sticky top-0 z-30 flex items-center gap-2 border-b border-line bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950 ${className ?? ""}`}
    >
      <StreakCounter pill />
      <StreakFreezeBadge pill />
      <ShekelCounter pill />
    </div>
  );
}
