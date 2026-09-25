"use client";

import { useMemo } from "react";
import type { MemorizationDay } from "@/types";
import { useProgressStore } from "@/store/useProgressStore";

export interface YesterdayReview {
  // Today's lesson hasn't reviewed the last lesson's verses yet — it starts with that review
  // (VerseLessonFlow.tsx's "previousReview" phase), and until it's done those verses need it.
  pending: boolean;
  // Those verses, as `${book}:${chapter}:${verse}` — they wear a yellow check while pending.
  verseKeys: Set<string>;
  // The first of them — where the "you are here" pin waits while the review is pending.
  first?: { book: string; chapter: number; verseNumber: number };
}

const NONE: YesterdayReview = { pending: false, verseKeys: new Set() };

// Whether today's lesson still owes a review of the previous lesson's verses. A new day's lesson
// always begins by reviewing what was learned last time before anything new; on the Mind Map that
// shows as those verses' checks turning yellow, and the pin stepping back to the first of them,
// until the review part of today's lesson is done (its saved `phaseIndex` moves past 0).
export function useYesterdayReview(pathKey: string | null, days: MemorizationDay[], completedDays: number, todaysDay: number): YesterdayReview {
  const reviewDone = useProgressStore((state) => (state.sessionCheckpoints[`${pathKey}:${todaysDay}`]?.phaseIndex ?? 0) >= 1);
  return useMemo(() => {
    if (!pathKey || reviewDone || completedDays >= todaysDay) return NONE;
    const today = days.find((day) => day.dayNumber === todaysDay);
    if (today?.kind !== "learn" || (today.previousVerses?.length ?? 0) === 0) return NONE;
    const previous = days
      .filter((day) => day.kind === "learn" && day.dayNumber < todaysDay && day.dayNumber <= completedDays && day.newVerses.length > 0)
      .sort((a, b) => b.dayNumber - a.dayNumber)[0];
    if (!previous) return NONE;
    const verseKeys = new Set(previous.newVerses.map((verse) => `${verse.book}:${verse.chapter}:${verse.verseNumber}`));
    const [firstVerse] = previous.newVerses;
    return { pending: true, verseKeys, first: { book: firstVerse.book, chapter: firstVerse.chapter, verseNumber: firstVerse.verseNumber } };
  }, [pathKey, reviewDone, days, completedDays, todaysDay]);
}
