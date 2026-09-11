import type { MemorizationDay, PathKind, PathProgress } from "@/types";

export interface BookChapterView {
  visibleDays: MemorizationDay[];
  title: string;
  // Book mode only: fraction of THIS chapter's own verses memorized so far, in place of the
  // plain "N of M lessons complete" every other path kind shows — see DayPathDiagram.tsx.
  chapterMemorizedFraction?: number;
  onNextChapter?: () => void;
  onPreviousChapter?: () => void;
}

// Extracted out of PathOverviewScreen.tsx purely to keep that file under this codebase's
// 200-line cap. Book mode shows one chapter at a time rather than the whole book's lesson
// list — the visible group is whichever chapter the next incomplete day belongs to. Once
// every day in a chapter's group is done, the next incomplete day naturally belongs to the
// next chapter (or, after the last chapter, to the undefined-group whole-book capstone). Every
// other path kind (`kind !== "book"`) is a no-op passthrough: the full day list, unmodified.
export function resolveBookChapterView(
  kind: PathKind,
  days: MemorizationDay[],
  plan: PathProgress,
  todaysDay: number,
  label: string,
  chapterOverride: number | null,
  setChapterOverride: (group: number) => void,
): BookChapterView {
  if (kind !== "book") {
    return { visibleDays: days, title: label };
  }

  const chapterGroups = Array.from(
    new Set(days.map((day) => day.chapterGroup).filter((group): group is number => group !== undefined)),
  ).sort((a, b) => a - b);
  const nextDay = days.find((day) => day.dayNumber === todaysDay);
  const group = chapterOverride ?? nextDay?.chapterGroup;
  const visibleDays = days.filter((day) => day.chapterGroup === group);

  if (group === undefined) {
    // Past every chapter (at the whole-book capstone) — still offer a way back into the
    // last chapter's circles for testing, since there's otherwise no entry point.
    const onPreviousChapter =
      chapterGroups.length > 0 ? () => setChapterOverride(chapterGroups[chapterGroups.length - 1]) : undefined;
    return { visibleDays, title: label, onPreviousChapter };
  }

  // "Mark 14", matching chapter-mode's own title format — no separate "Chapter 14 of 16" line.
  const title = `${label} ${group}`;
  const learnDays = visibleDays.filter((day) => day.kind === "learn");
  const completedLearnDays = learnDays.filter((day) => day.dayNumber <= plan.completedDays).length;
  const chapterMemorizedFraction = learnDays.length > 0 ? completedLearnDays / learnDays.length : 0;
  const groupIndex = chapterGroups.indexOf(group);
  const onNextChapter = groupIndex !== -1 && groupIndex < chapterGroups.length - 1 ? () => setChapterOverride(chapterGroups[groupIndex + 1]) : undefined;
  const onPreviousChapter = groupIndex > 0 ? () => setChapterOverride(chapterGroups[groupIndex - 1]) : undefined;

  return { visibleDays, title, chapterMemorizedFraction, onNextChapter, onPreviousChapter };
}
