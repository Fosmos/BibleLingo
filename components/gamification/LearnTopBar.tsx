"use client";

import { useEffect } from "react";
import type { MemorizationDay } from "@/types";
import { useLessonSessionStore } from "@/store/useLessonSessionStore";
import type { ChapterReadingLayout } from "@/lib/useChapterReadingLayout";
import type { Phase } from "@/components/gamification/LearnPhaseContent";
import { LessonChrome } from "@/components/gamification/LessonChrome";
import { LearnVerseSpotlightChrome } from "@/components/gamification/LearnVerseSpotlightChrome";

// The four per-verse drilling phases the compact Mind Map spotlight applies to (see
// LearnVerseSpotlightChrome.tsx) — every other phase (Orientation/Orientation Summary/Pray, the
// whole-day cumulative typing step) isn't about one specific verse, so it keeps the plain
// LessonChrome unchanged.
const SPOTLIGHT_PHASES = new Set<Phase | "type_cumulative_today">(["rhythm", "draw_first_letters", "speak_hint", "speak_verse"]);

interface LearnTopBarProps {
  phase: Phase | "type_cumulative_today";
  verseIndex: number | undefined;
  day: MemorizationDay;
  allDays: MemorizationDay[];
  completedDays: number;
  todaysDay: number;
  label: string;
  version: string;
  current: number;
  total: number;
  onExit?: () => void;
  layout: ChapterReadingLayout;
  // See InPlaceLessonSession.tsx's own doc comment — threaded straight through to
  // LearnVerseSpotlightChrome.
  embeddedInMindMap?: boolean;
}

// LearnSection.tsx's own single `topBar`, split out purely to keep that file under this
// codebase's 200-line cap (see CLAUDE.md) — no behavior difference from having it inline there.
export function LearnTopBar({ phase, verseIndex, day, allDays, completedDays, todaysDay, label, version, current, total, onExit, layout, embeddedInMindMap }: LearnTopBarProps) {
  // The Mind Map sheet shows no top bar of its own — just a thin progress line under its
  // breadcrumb (MindMapSheetBreadcrumb.tsx), fed from here.
  const setLessonProgress = useLessonSessionStore((state) => state.setLessonProgress);
  useEffect(() => {
    if (embeddedInMindMap && total > 0) setLessonProgress((current - 1) / total);
  }, [embeddedInMindMap, current, total, setLessonProgress]);

  // Inside the Mind Map sheet, EVERY stage drilling one verse (Listen and both Fill In The Blank
  // stages too) reports that verse up, so the real canvas and the page-top breadcrumb follow it —
  // and the lesson-opening whole-day stages (Understand, Visualize) report today's FIRST verse,
  // rather than leaving the canvas on whichever chip was tapped to open the sheet.
  const isOpening = phase === "orientation" || phase === "orientation_summary";
  const isSpotlight = SPOTLIGHT_PHASES.has(phase) || (embeddedInMindMap === true && (verseIndex !== undefined || isOpening));
  const spotlightVerse = isSpotlight ? day.newVerses[verseIndex ?? (isOpening ? 0 : day.newVerses.length - 1)] : undefined;
  if (spotlightVerse) {
    return (
      <LearnVerseSpotlightChrome
        verse={spotlightVerse}
        allDays={allDays}
        day={day}
        completedDays={completedDays}
        todaysDay={todaysDay}
        onExit={onExit}
        layout={layout}
        embeddedInMindMap={embeddedInMindMap}
      />
    );
  }
  return <LessonChrome label={label} version={version} current={current} total={total} onExit={onExit} layout={layout} embeddedInMindMap={embeddedInMindMap} />;
}
