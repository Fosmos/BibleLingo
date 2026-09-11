import type { MemorizationDay, VerseSegment } from "@/types";

// Book mode only: when `day` is the last "learn" day tagged with its own chapter, that
// chapter's verses (so DaySessionController can graduate them straight into SRS the moment
// this lesson finishes — see completeBookChapter in useProgressStore.ts for why this can't
// just wait and re-resolve the whole book later). Undefined for every other day. Shared by
// DayLoader.tsx (the standalone `/day/[dayNumber]` route) and PathOverviewScreen.tsx (the
// in-place lesson flow reached from the parchment view) — both need the exact same answer for
// the same day, so this lives in one place rather than two copies that could drift apart.
export function resolveCompletingChapterVerses(
  day: MemorizationDay,
  days: MemorizationDay[],
  verses: VerseSegment[],
): VerseSegment[] | undefined {
  const isFinalLearnDayOfChapter =
    day.kind === "learn" &&
    day.chapterGroup !== undefined &&
    !days.some((candidate) => candidate.kind === "learn" && candidate.chapterGroup === day.chapterGroup && candidate.dayNumber > day.dayNumber);
  return isFinalLearnDayOfChapter ? verses.filter((verse) => verse.chapter === day.chapterGroup) : undefined;
}
