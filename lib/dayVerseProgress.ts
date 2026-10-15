import type { MemorizationDay, PathProgress, VerseSegment } from "@/types";

// Each verse of a lesson day is its own lesson on the trail: a day is learned as a whole once it's
// completed, and the next day's first `versesIntoDay` verses are learned already.
export function learnedVersesOfDay(day: MemorizationDay, plan: Pick<PathProgress, "completedDays" | "versesIntoDay">): VerseSegment[] {
  if (day.kind !== "learn") return [];
  if (day.dayNumber <= plan.completedDays) return day.newVerses;
  return day.dayNumber === plan.completedDays + 1 ? day.newVerses.slice(0, plan.versesIntoDay ?? 0) : [];
}

// The day's one verse as a lesson of its own — the day's earlier verses count as learned before it,
// so its cumulative checks reach back over them.
export function singleVerseDay(day: MemorizationDay, verse: VerseSegment): MemorizationDay {
  const index = day.newVerses.findIndex((candidate) => candidate.chapter === verse.chapter && candidate.verseNumber === verse.verseNumber);
  if (index < 0 || day.newVerses.length === 1) return day;
  return { ...day, newVerses: [day.newVerses[index]], previousVerses: [...(day.previousVerses ?? []), ...day.newVerses.slice(0, index)] };
}

export const verseIndexInDay = (day: MemorizationDay, chapter: number, verseNumber: number): number =>
  day.newVerses.findIndex((verse) => verse.chapter === chapter && verse.verseNumber === verseNumber);
