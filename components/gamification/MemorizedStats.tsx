"use client";

import { useProgressStore } from "@/store/useProgressStore";
import { computeMemorizedStats } from "@/lib/progressSummary";
import { useMemorizedChaptersLoaded } from "@/lib/useMemorizedChaptersLoaded";

interface StatCircleProps {
  label: string;
  value: number;
  className: string;
}

function StatCircle({ label, value, className }: StatCircleProps) {
  return (
    <div className={`flex aspect-square flex-1 flex-col items-center justify-center gap-0.5 rounded-full ${className}`}>
      <span className="font-heading text-[30px] leading-none">{value.toLocaleString()}</span>
      <span className="text-xs font-bold">{label}</span>
    </div>
  );
}

// The Memorized page's three totals — books, chapters and verses fully memorized — as soft circles.
export function MemorizedStats() {
  const memorizedEntities = useProgressStore((state) => state.memorizedEntities);
  // Re-renders as missing chapters load in, so a hand-added book counts once its text is here.
  useMemorizedChaptersLoaded(memorizedEntities);
  const stats = computeMemorizedStats(memorizedEntities);

  return (
    <div className="flex gap-2.5">
      <StatCircle label={stats.books === 1 ? "Book" : "Books"} value={stats.books} className="bg-sage-200 text-sage-800 dark:bg-sage-900 dark:text-sage-200" />
      <StatCircle label={stats.chapters === 1 ? "Chapter" : "Chapters"} value={stats.chapters} className="bg-brand-200 text-brand-800 dark:bg-brand-900 dark:text-brand-200" />
      <StatCircle label={stats.verses === 1 ? "Verse" : "Verses"} value={stats.verses} className="bg-sand-300 text-sand-900 dark:bg-zinc-800 dark:text-zinc-200" />
    </div>
  );
}
