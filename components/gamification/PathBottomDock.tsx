"use client";

import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, RotateCcw, Zap } from "lucide-react";
import type { MemorizationDay } from "@/types";
import { TAP_SCALE } from "@/lib/motionTokens";
import { formatLessonDuration } from "@/lib/learnIntensity";
import { dayLabel } from "@/components/gamification/DayCircle";

interface PathBottomDockProps {
  onPreviousChapter?: () => void;
  onNextChapter?: () => void;
  todaysDay?: MemorizationDay;
  // True once today's own lesson is already finished (see lib/dayRollover.ts's
  // hasCompletedToday) — `todaysDay` above still resolves to that same day (never hidden),
  // so its own verseLabel/kind stay available to caption the completed state below.
  todaysCompleted: boolean;
  verseLabel: string | null;
  lessonSeconds: number;
  onSelectDay: (dayNumber: number) => void;
  // Reviews todaysDay's own verses in the same first-letter recall drill DayCircle.tsx's own
  // "Review" button opens on a completed learn day (see InPlaceLessonSession.tsx's
  // isReview/PracticeChain mode: "firstLetter") — offered here too once todaysCompleted, so
  // there's still a primary action once Start Lesson's own job is done for the day.
  onPracticeDay: (dayNumber: number) => void;
}

// DayPathDiagram.tsx's own sticky bottom dock, split out purely to keep that file under this
// codebase's 200-line cap — the secondary nav row (chapter Previous/Next) as compact icon-only
// buttons rather than text links, so the row stays tight instead of competing for width/
// attention with the one primary action below it (Start Lesson, or Review once done). Icon-only
// doesn't drop any capability — each button keeps its own aria-label — it just isn't spelled
// out inline anymore.
export function PathBottomDock({
  onPreviousChapter,
  onNextChapter,
  todaysDay,
  todaysCompleted,
  verseLabel,
  lessonSeconds,
  onSelectDay,
  onPracticeDay,
}: PathBottomDockProps) {
  return (
    // Sticky, not just "last in the flex column" — this app's pages grow with their own
    // content and let the whole window scroll (see AuthGate.tsx's `min-h-full`), so without
    // `sticky` this bar would sit at the very end of a long chapter's text instead of staying
    // reachable. `bottom-20` (not `bottom-0`) because `sticky` positions relative to the
    // viewport here (`<main>` itself never scrolls) — its own `pb-20` reserving room for
    // BottomTabBar.tsx's fixed nav is invisible to sticky math, so this has to clear that same
    // 5rem itself.
    <div className="sticky bottom-20 z-20 flex flex-col items-center gap-1 border-t border-line bg-white px-6 py-1.5 dark:border-zinc-800 dark:bg-zinc-950">
      {(onPreviousChapter || onNextChapter) && (
        <div className="flex items-center justify-center gap-1">
          {onPreviousChapter && (
            <button
              type="button"
              onClick={onPreviousChapter}
              aria-label="Previous chapter"
              className="flex h-7 w-7 items-center justify-center rounded-full text-ink-muted hover:bg-mist hover:text-brand-600 dark:hover:bg-zinc-800"
            >
              <ChevronLeft size={13} />
            </button>
          )}
          {onNextChapter && (
            <button
              type="button"
              onClick={onNextChapter}
              aria-label="Next chapter"
              className="flex h-7 w-7 items-center justify-center rounded-full text-ink-muted hover:bg-mist hover:text-brand-600 dark:hover:bg-zinc-800"
            >
              <ChevronRight size={13} />
            </button>
          )}
        </div>
      )}
      {todaysDay && (
        <div className="flex w-full max-w-sm flex-col gap-1">
          {todaysDay.kind === "learn" && verseLabel && (
            <p className="flex items-center gap-1 self-center text-xs font-medium text-ink-muted">
              <Zap size={12} className="text-brand-500" />
              Today&apos;s Lesson: {verseLabel} ({formatLessonDuration(lessonSeconds)})
            </p>
          )}
          {todaysCompleted ? (
            todaysDay.kind === "learn" ? (
              <motion.button
                type="button"
                whileTap={TAP_SCALE}
                onClick={() => onPracticeDay(todaysDay.dayNumber)}
                className="flex w-full items-center justify-center gap-1.5 rounded-full bg-green-50 py-2 text-sm font-semibold text-green-700 dark:bg-green-950 dark:text-green-400"
              >
                <RotateCcw size={16} /> Review
              </motion.button>
            ) : (
              <p className="flex w-full items-center justify-center gap-1.5 rounded-full bg-green-50 py-2 text-sm font-semibold text-green-700 dark:bg-green-950 dark:text-green-400">
                Completed
              </p>
            )
          ) : (
            <motion.button
              type="button"
              whileTap={TAP_SCALE}
              onClick={() => onSelectDay(todaysDay.dayNumber)}
              className="flex w-full items-center justify-center gap-1.5 rounded-full bg-brand-500 py-2 text-sm font-semibold text-white"
            >
              {todaysDay.kind === "learn" ? "Start Lesson" : dayLabel(todaysDay)} <ChevronRight size={16} />
            </motion.button>
          )}
        </div>
      )}
    </div>
  );
}
