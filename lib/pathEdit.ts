import type { MemorizationDay, PathProgress, PathReminder, VerseSegment } from "@/types";
import { buildPathDayPlan } from "@/lib/dayPlan";

export const PATH_REMINDERS: { value: PathReminder; title: string; sub: string }[] = [
  { value: "morning", title: "Morning", sub: "7:00 AM" },
  { value: "midday", title: "Lunchtime", sub: "12:30 PM" },
  { value: "evening", title: "Evening", sub: "8:00 PM" },
  { value: "off", title: "No reminder", sub: "I'll remember myself" },
];

// How many verses, from the start of the path, a plan's completed days and verses into the next day cover.
function learnedCount(days: MemorizationDay[], plan: PathProgress): number {
  const done = days.filter((day) => day.dayNumber <= plan.completedDays).reduce((sum, day) => sum + day.newVerses.length, 0);
  return done + (plan.versesIntoDay ?? 0);
}

// A path's progress at a new number of verses a day. Its lessons fall differently, so its completed
// days and verses into the next day are worked out again, to land on the same next verse. Pure.
export function rePace(key: string, verses: VerseSegment[], plan: PathProgress, versesPerDay: number): Pick<PathProgress, "versesPerDay" | "completedDays" | "versesIntoDay"> {
  let left = learnedCount(buildPathDayPlan(key, verses, plan), plan);
  let completedDays = 0;
  for (const day of buildPathDayPlan(key, verses, { ...plan, versesPerDay })) {
    // A day with no new verses of its own (a review day) waits until there's learned content past it.
    if (left === 0 || left < day.newVerses.length) break;
    left -= day.newVerses.length;
    completedDays = day.dayNumber;
  }
  return { versesPerDay, completedDays, versesIntoDay: left || undefined };
}
