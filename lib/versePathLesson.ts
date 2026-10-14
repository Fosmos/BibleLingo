import type { VerseSegment } from "@/types";
import { useProgressStore } from "@/store/useProgressStore";
import { buildPathDayPlan } from "@/lib/dayPlan";
import { todaysDayNumber } from "@/lib/dayRollover";
import { resolvePathLabel } from "@/lib/memorizationContent";
import { verseRunPathKey } from "@/lib/singleVersePath";
import type { ChapterPathPage } from "@/components/gamification/ChapterPathLesson";

// Learn on a verse that isn't the path's next one, run right where it is in the reader: the verse
// becomes a path of its own (added to your active paths, but the one you're on stays focused),
// and this returns that path's lesson to run in place. Null if it has nothing left to learn.
export function versePathLesson(verse: VerseSegment, version: string): { page: ChapterPathPage; dayNumber: number } | null {
  const key = verseRunPathKey(verse.book, verse.chapter, verse.verseNumber, verse.verseNumber);
  const store = useProgressStore.getState();
  const focused = store.activePathKey;
  if (store.paths[key]?.version !== version) store.setPath(key, version);
  store.setActivePath(key);
  if (focused) store.setActivePath(focused);
  const plan = useProgressStore.getState().paths[key];
  if (!plan) return null;
  const verses = [verse];
  const days = buildPathDayPlan(key, verses, plan);
  const day = days.find((candidate) => candidate.kind === "learn" && candidate.dayNumber > plan.completedDays);
  if (!day) return null;
  const page = { pathKey: key, label: resolvePathLabel(key) ?? verse.reference, days, verses, version, completedDays: plan.completedDays, todaysDay: todaysDayNumber(plan, new Date()) };
  return { page, dayNumber: day.dayNumber };
}
