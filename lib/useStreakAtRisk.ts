"use client";

import { useProgressStore } from "@/store/useProgressStore";
import { daysSinceLastCompletion } from "@/lib/streak";

// True while the reader has a real streak going but hasn't yet completed anything today — a
// nudge, not a countdown to loss (this app's own streak-loss grace already accounts for rest
// days, see lib/streak.ts's obligatedGapDays; duplicating that finer logic here for a passive
// glance-at-the-map cue would overstate the actual risk). Derived at read time from the same
// `streak` state every other streak UI already reads (CLAUDE.md's "derived, not stored" rule) —
// never a separate stored flag that could drift.
export function useStreakAtRisk(): boolean {
  const currentStreak = useProgressStore((state) => state.streak.currentStreak);
  const lastCompletedAt = useProgressStore((state) => state.streak.lastCompletedAt);
  if (currentStreak === 0) return false;
  return daysSinceLastCompletion(lastCompletedAt, new Date()) > 0;
}
