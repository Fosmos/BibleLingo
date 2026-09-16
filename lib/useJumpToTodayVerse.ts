"use client";

import { useState } from "react";
import type { PathProgress, VerseSegment } from "@/types";
import { buildPathDayPlan } from "@/lib/dayPlan";
import { applyReferencePreference } from "@/lib/chapterContent";
import { parsePathKey } from "@/lib/memorizationContent";
import { todaysDayNumber } from "@/lib/dayRollover";

// Set by the Home screen's own "Go to your path" button (see TodayVersesCard.tsx, which
// appends ?today=1) — book mode otherwise always lands on its Mind Map (see
// PathOverviewScreen.tsx's render), unlike every other path kind, which already opens straight
// to today's lesson via useChapterPagination's own anchor. Jumps book mode there too, once per
// fresh arrival at this path (keyed on `key`, the same "adjust state during render" pattern as
// lib/useTargetVerseOverride.ts), the same way a Mind Map pericope tap does (selectPericope).
// Pulled out of PathOverviewScreen.tsx purely to keep that file under this codebase's 200-line
// cap — verses/plan can still be null here (this runs before that screen's own loading gates),
// so it re-derives its own tiny day plan slice rather than needing them pre-resolved.
export function useJumpToTodayVerse(
  key: string,
  jumpToToday: boolean | undefined,
  verses: VerseSegment[] | null,
  plan: PathProgress | undefined,
  includeVerseReferences: boolean,
  pegSystemEnabled: boolean,
  selectPericope: (chapter: number, startVerse?: number) => void,
): void {
  const [appliedForKey, setAppliedForKey] = useState<string | undefined>(undefined);
  const { kind } = parsePathKey(key);
  if (jumpToToday && kind === "book" && verses && plan && key !== appliedForKey) {
    setAppliedForKey(key);
    const days = buildPathDayPlan(key, applyReferencePreference(verses, includeVerseReferences), plan, pegSystemEnabled);
    const todaysDay = todaysDayNumber(plan, new Date());
    const todaysLearnDay = days.find((day) => day.kind === "learn" && day.dayNumber === todaysDay);
    const verse = todaysLearnDay?.newVerses[0];
    if (verse) selectPericope(verse.chapter, verse.verseNumber);
  }
}
