"use client";

import { useProgressStore } from "@/store/useProgressStore";
import { computeMemorizedStats } from "@/lib/progressSummary";
import { useMemorizedChaptersLoaded } from "@/lib/useMemorizedChaptersLoaded";
import { StatCircle, STAT_CIRCLE_CLASSES } from "@/components/gamification/StatCircle";

// The Memorized page's three totals — books, chapters and verses fully memorized — as soft circles.
export function MemorizedStats() {
  const memorizedEntities = useProgressStore((state) => state.memorizedEntities);
  // Re-renders as missing chapters load in, so a hand-added book counts once its text is here.
  useMemorizedChaptersLoaded(memorizedEntities);
  const stats = computeMemorizedStats(memorizedEntities);

  return (
    <div className="flex gap-2.5">
      <StatCircle label={stats.books === 1 ? "Book" : "Books"} value={stats.books} className={STAT_CIRCLE_CLASSES.books} />
      <StatCircle label={stats.chapters === 1 ? "Chapter" : "Chapters"} value={stats.chapters} className={STAT_CIRCLE_CLASSES.chapters} />
      <StatCircle label={stats.verses === 1 ? "Verse" : "Verses"} value={stats.verses} className={STAT_CIRCLE_CLASSES.verses} />
    </div>
  );
}
