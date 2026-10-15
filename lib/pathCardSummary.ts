import type { MemorizedEntity, PathProgress } from "@/types";
import { resolvePath } from "@/lib/memorizationContent";
import { buildPathDayPlan } from "@/lib/dayPlan";
import { formatVerseRangeLabel } from "@/lib/chapterContent";
import { isDue } from "@/lib/srs";

// What Home's path card shows for one path (design_handoff_path_picker → Your paths): how far
// through it is, what's next, how many of its reviews are due, and whether it's finished. Built
// from the path's own day plan when its verses are on this device; "Day N" style otherwise.
export interface PathCardSummary {
  percent: number;
  next: string | null;
  due: number;
  finished: boolean;
}

export function summarizePath(key: string, plan: PathProgress, entities: MemorizedEntity[], now: Date = new Date()): PathCardSummary {
  const verses = resolvePath(key)?.verses ?? [];
  const covers = (entity: MemorizedEntity) => verses.some((verse) => verse.book === entity.book && verse.chapter === entity.chapter && verse.verseNumber >= entity.startVerse && verse.verseNumber <= entity.endVerse);
  const due = entities.filter((entity) => isDue(entity.srs, now) && covers(entity)).length;
  if (!verses.length) return { percent: 0, next: `Day ${plan.completedDays + 1}`, due, finished: false };
  const days = buildPathDayPlan(key, verses, plan);
  const nextDay = days.find((day) => day.dayNumber > plan.completedDays);
  // Each verse is its own lesson: next is the day's first verse not yet learned.
  const into = nextDay && nextDay.dayNumber === plan.completedDays + 1 ? Math.min(plan.versesIntoDay ?? 0, nextDay.newVerses.length - 1) : 0;
  const percent = days.length ? Math.round((Math.min(plan.completedDays, days.length) / days.length) * 100) : 0;
  const next = nextDay ? (nextDay.kind === "learn" ? formatVerseRangeLabel(nextDay.newVerses.slice(into, into + 1)) : nextDay.kind === "boss_battle" || nextDay.kind === "section_boss_battle" ? "Boss battle" : "Review day") : null;
  return { percent, next, due, finished: !nextDay };
}
