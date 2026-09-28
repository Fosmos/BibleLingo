import type { MemorizationDay, PathProgress } from "@/types";
import { resolvePath } from "@/lib/memorizationContent";
import { buildPathDayPlan } from "@/lib/dayPlan";

// Whether every verse of a path has been learned — each of its learn days is done. What's left
// after that (chapter reviews, the boss battle) is recall practice that spaced review (SRS)
// already covers, so the path counts as complete and leaves the reader's active paths.
export function isPathLearned(days: MemorizationDay[], completedDays: number): boolean {
  const learnDays = days.filter((day) => day.kind === "learn");
  return learnDays.length > 0 && learnDays.every((day) => day.dayNumber <= completedDays);
}

// Whether a saved path has every verse learned, from its cached content — undefined when that
// content isn't cached yet (a book path, or a chapter never fetched on this device).
export function isPathKeyLearned(key: string, plan: PathProgress | undefined): boolean | undefined {
  if (!plan) return false;
  const verses = resolvePath(key)?.verses;
  if (!verses) return undefined;
  return isPathLearned(buildPathDayPlan(key, verses, plan), plan.completedDays);
}
