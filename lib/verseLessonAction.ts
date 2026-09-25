import type { MemorizationDay } from "@/types";

export interface VerseLessonAction {
  dayNumber: number;
  mode: "select" | "practice";
  label: string;
}

// The learn day whose own newVerses actually contain this verse — not the pericope's single
// "home" day, which a short pericope a lesson merely passes through never has. Undefined for a
// verse no learn day covers.
export function findVerseLessonDay(days: MemorizationDay[], chapter: number, verseNumber: number): MemorizationDay | undefined {
  return days.find((day) => day.kind === "learn" && day.newVerses.some((verse) => verse.chapter === chapter && verse.verseNumber === verseNumber));
}

// The one action the Mind Map's verse preview tab offers for that day — "Review" once it's done
// (practice mode, no progress side effects), "Continue" if it has a saved mid-lesson checkpoint,
// "Learn" otherwise. Labeled with the lesson's own real range: a lesson covers every verse in its
// day, so a tapped v3 in a v1–5 lesson reads "Learn Jude 1:1–5", not a promise of just v3.
export function verseLessonAction(day: MemorizationDay, completedDays: number, hasCheckpoint: boolean): VerseLessonAction | null {
  const first = day.newVerses[0];
  const last = day.newVerses[day.newVerses.length - 1];
  if (!first || !last) return null;

  const end = last.chapter !== first.chapter ? `–${last.chapter}:${last.verseNumber}` : last.verseNumber !== first.verseNumber ? `–${last.verseNumber}` : "";
  const reference = `${first.book} ${first.chapter}:${first.verseNumber}${end}`;
  if (day.dayNumber <= completedDays) return { dayNumber: day.dayNumber, mode: "practice", label: `Review ${reference}` };
  return { dayNumber: day.dayNumber, mode: "select", label: `${hasCheckpoint ? "Continue" : "Learn"} ${reference}` };
}
