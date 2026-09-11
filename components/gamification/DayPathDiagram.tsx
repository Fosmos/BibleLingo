"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronLeft, Layers } from "lucide-react";
import type { MemorizationDay } from "@/types";
import { useProgressStore } from "@/store/useProgressStore";
import { MOTION_DURATION } from "@/lib/motionTokens";
import { estimateLessonSeconds } from "@/lib/learnIntensity";
import { useChapterPagination } from "@/lib/useChapterPagination";
import { useTargetVerseOverride } from "@/lib/useTargetVerseOverride";
import { useParchmentFillHeight } from "@/lib/useParchmentFillHeight";
import { ChapterReadingView } from "@/components/gamification/ChapterReadingView";
import { BuildingRoomView } from "@/components/gamification/BuildingRoomView";
import { PathBottomDock } from "@/components/gamification/PathBottomDock";

interface DayPathDiagramProps {
  label: string;
  version: string;
  days: MemorizationDay[];
  // The path's FULL, unscoped day list — book mode's `days` prop above may be narrowed to just
  // the currently-viewed chapter, but "Next day (testing)" always needs to find whichever day
  // is globally next regardless of which chapter happens to be in view.
  allDays: MemorizationDay[];
  completedDays: number;
  // completedDays + 1, gated so it only advances once a real calendar day has passed since
  // this path's last completion — see lib/dayRollover.ts's own activeDayNumber. -1 (never a
  // real dayNumber) whenever today's own lesson is already done: nothing new to offer until
  // tomorrow. Used ONLY for this component's own "is there something new to start" gating
  // (the bottom dock's Start Lesson prompt) — everything else it hands further down uses
  // todaysDayNumber below instead.
  activeDayNumber: number;
  // Whichever day counts as TODAY's own lesson (lib/dayRollover.ts's todaysDayNumber) —
  // always a real dayNumber, never gated to -1, so today's own verses/pericope/chapter keep
  // reading as "today" (gold highlight, amber Mind Map ring) even once that lesson is done.
  todaysDayNumber: number;
  pathKey: string;
  onSelectDay: (dayNumber: number) => void;
  onPracticeDay: (dayNumber: number) => void;
  // Book mode only: fraction (0-1) of the current chapter's own verses memorized so far —
  // drives the "N% Memorized" progress bar instead of the plain lessons-complete fraction
  // every other path kind gets.
  chapterMemorizedFraction?: number;
  onNextChapter?: () => void;
  onPreviousChapter?: () => void;
  // Book mode only: returns to that path's own Mind Map (see PathOverviewScreen.tsx) — when
  // set, the top bar's "Back" button goes there instead of leaving the Path screen entirely,
  // since the Mind Map is this path's own landing view, one level up from a chapter's
  // parchment view. Undefined for every other path kind, which has no Mind Map to return to.
  onShowMindMap?: () => void;
  // Book mode's own Mind Map (see MindMapScreen.tsx) — a pericope tap sets this to its own
  // first verse, opening the real page holding it instead of the "today's lesson" default
  // (see useTargetVerseOverride.ts). Undefined leaves that default untouched.
  targetVerse?: number;
}

// The Path view's chrome around whichever body is showing (the parchment ChapterReadingView,
// or BuildingRoomView's card-per-section layout when the Building setting is on): a slim top
// bar (back, book/chapter + translation, page count), an edge-to-edge progress bar, then the
// body, then PathBottomDock.tsx's own sticky bottom dock (secondary nav + the one primary
// action). Pagination state itself lives in lib/useChapterPagination.ts, called once here
// (this is the nearest common parent of the top bar's own page count and ChapterReadingView's
// page body) and handed down as controlled props rather than let each place keep its own copy.
export function DayPathDiagram({
  label,
  version,
  days,
  allDays,
  completedDays,
  activeDayNumber,
  todaysDayNumber,
  pathKey,
  onSelectDay,
  onPracticeDay,
  chapterMemorizedFraction,
  onNextChapter,
  onPreviousChapter,
  onShowMindMap,
  targetVerse,
}: DayPathDiagramProps) {
  const router = useRouter();
  const buildingViewEnabled = useProgressStore((state) => state.buildingViewEnabled);
  const understandStageEnabled = useProgressStore((state) => state.understandStageEnabled);
  const visualizeStageEnabled = useProgressStore((state) => state.visualizeStageEnabled);
  const writeFirstLetterStageEnabled = useProgressStore((state) => state.writeFirstLetterStageEnabled);
  const fillInTheBlankStageEnabled = useProgressStore((state) => state.fillInTheBlankStageEnabled);
  const { bodyTopRef, dockRef, fillHeightPx } = useParchmentFillHeight();
  const pagination = useChapterPagination(days, completedDays, todaysDayNumber, fillHeightPx);
  useTargetVerseOverride(pagination.pages, targetVerse, pagination.goToPage);
  // Deliberately the real completedDays + 1, never the gated activeDayNumber — this button's
  // whole purpose is bypassing the normal pace for testing, so it stays available to skip
  // straight to the next day even while resting until tomorrow (see lib/dayRollover.ts).
  const nextDay = allDays.find((candidate) => candidate.dayNumber === completedDays + 1);
  // The one thing still gated on the TRUE activeDayNumber (not todaysDayNumber) — whether the
  // bottom dock offers to START a new lesson right now. Scoped to the currently-VIEWED days
  // (unlike nextDay above, which deliberately ignores chapter scoping for the testing
  // shortcut) — the primary action only ever offers to start today's lesson when today's
  // lesson actually belongs to the chapter on screen.
  const startableDay = days.find((day) => day.dayNumber === activeDayNumber);
  // completedDays is a path-wide counter, but `days` may be a single chapter's subset —
  // scope the visible count to what's actually rendered here.
  const visibleCompletedCount = days.filter((day) => day.dayNumber <= completedDays).length;
  const overallProgress = days.length > 0 ? visibleCompletedCount / days.length : 0;
  const progressFraction = chapterMemorizedFraction ?? overallProgress;

  const todaysVerses = startableDay?.newVerses ?? [];
  const lessonSeconds = estimateLessonSeconds(todaysVerses.length, {
    understandStageEnabled,
    visualizeStageEnabled,
    writeFirstLetterStageEnabled,
    fillInTheBlankStageEnabled,
  });
  const verseLabel =
    todaysVerses.length === 0
      ? null
      : todaysVerses.length === 1
        ? `v${todaysVerses[0].verseNumber}`
        : `v${todaysVerses[0].verseNumber}–${todaysVerses[todaysVerses.length - 1].verseNumber}`;

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center justify-between gap-2 px-4 pb-1 pt-4">
        <button
          type="button"
          onClick={onShowMindMap ?? (() => router.back())}
          className="flex shrink-0 items-center gap-1 text-sm font-medium text-ink-muted hover:text-brand-600"
        >
          <ChevronLeft size={16} /> Back
        </button>
        <p className="flex-1 truncate text-center text-sm font-semibold uppercase tracking-wide text-ink-soft dark:text-zinc-300">
          {label} <span className="text-ink-muted">• {version}</span>
        </p>
        {!buildingViewEnabled && pagination.pages.length > 1 ? (
          <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-ink-muted">
            <Layers size={13} /> Page {pagination.pageIndex + 1} of {pagination.pages.length}
          </span>
        ) : (
          <span className="w-11 shrink-0" />
        )}
      </div>
      <div
        className="h-1.5 w-full bg-mist dark:bg-zinc-800"
        role="progressbar"
        aria-valuenow={Math.round(progressFraction * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <motion.div
          className="h-full bg-brand-500"
          initial={{ width: 0 }}
          animate={{ width: `${progressFraction * 100}%` }}
          transition={{ duration: MOTION_DURATION.base }}
        />
      </div>

      {/* useParchmentFillHeight.ts's own top marker — its top edge is where the parchment
          card's available space starts measuring from; zero height, purely a position probe. */}
      <div ref={bodyTopRef} />

      {buildingViewEnabled ? (
        <BuildingRoomView
          days={days}
          completedDays={completedDays}
          todaysDayNumber={todaysDayNumber}
          pathKey={pathKey}
          onSelectDay={onSelectDay}
          onPracticeDay={onPracticeDay}
        />
      ) : (
        <ChapterReadingView
          pages={pagination.pages}
          pageIndex={pagination.pageIndex}
          goToPage={pagination.goToPage}
          hasNext={pagination.hasNext}
          hasPrevious={pagination.hasPrevious}
          dayNumberByVerse={pagination.dayNumberByVerse}
          todaysVerseNumbers={pagination.todaysVerseNumbers}
          completedDays={completedDays}
          onSelectDay={onSelectDay}
          onPracticeDay={onPracticeDay}
          fillHeightPx={fillHeightPx}
        />
      )}

      <div ref={dockRef}>
        <PathBottomDock
          pathKey={pathKey}
          nextDay={nextDay}
          onPreviousChapter={onPreviousChapter}
          onNextChapter={onNextChapter}
          todaysDay={startableDay}
          verseLabel={verseLabel}
          lessonSeconds={lessonSeconds}
          onSelectDay={onSelectDay}
        />
      </div>
    </div>
  );
}
