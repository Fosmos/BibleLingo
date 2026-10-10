import type { MemorizationDay, VerseSegment } from "@/types";

// Book mode only: when `day` is the last "learn" day tagged with its own chapter, that
// chapter's verses (so DaySessionController can graduate them straight into SRS the moment
// this lesson finishes — see completeBookChapter in useProgressStore.ts for why this can't
// just wait and re-resolve the whole book later). Undefined for every other day. Shared by
// DayLoader.tsx (the standalone `/day/[dayNumber]` route) and PathOverviewScreen.tsx (the
// in-place lesson flow reached from the parchment view) — both need the exact same answer for
// the same day, so this lives in one place rather than two copies that could drift apart.
// A lesson can run across a chapter boundary, so it may finish one chapter (or, with short
// chapters, several) while starting the next: every chapter this day has verses in and no later
// learn day does is returned.
export function resolveCompletingChapterVerses(
  day: MemorizationDay,
  days: MemorizationDay[],
  verses: VerseSegment[],
): VerseSegment[] | undefined {
  if (day.kind !== "learn" || day.chapterGroup === undefined) return undefined;
  const later = days.filter((candidate) => candidate.kind === "learn" && candidate.dayNumber > day.dayNumber);
  const finished = new Set(
    day.newVerses.map((verse) => verse.chapter).filter((chapter) => !later.some((candidate) => candidate.newVerses.some((verse) => verse.chapter === chapter))),
  );
  return finished.size ? verses.filter((verse) => finished.has(verse.chapter)) : undefined;
}
