"use client";

import { useMemo } from "react";
import type { MemorizationDay } from "@/types";
import { chapterScopedDays } from "@/lib/chapterScopedDays";
import { useChapterReadingLayout, type ChapterReadingLayout } from "@/lib/useChapterReadingLayout";

// Combines chapterScopedDays (see its own doc comment — book mode's day plan spans every
// chapter, and pagination needs just the one this stage's own verses actually fall in) with
// useChapterReadingLayout, so any caller with a full/unscoped day plan plus one "active" day
// (whichever day's own verses this stage is drilling) gets back the real chapter page(s) that
// day's own chapter uses — same real pagination/font-size as the reading view, in one call.
export function useChapterScopedReadingLayout(
  allDays: MemorizationDay[],
  activeDay: MemorizationDay,
  completedDays: number,
  todaysDay: number,
): ChapterReadingLayout {
  const scopedDays = useMemo(() => chapterScopedDays(allDays, activeDay), [allDays, activeDay]);
  return useChapterReadingLayout(scopedDays, completedDays, todaysDay);
}
