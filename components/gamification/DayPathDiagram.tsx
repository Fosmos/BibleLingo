"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Map, ChevronLeft, ChevronRight } from "lucide-react";
import type { MemorizationDay } from "@/types";
import { getDayProgress } from "@/lib/dayProgress";
import { MOTION_DURATION } from "@/lib/motionTokens";
import { DayCircle } from "@/components/gamification/DayCircle";
import { PathMilestoneDivider } from "@/components/gamification/PathMilestoneDivider";
import { InfoTip } from "@/components/ui/InfoTip";
import { INFO_TIPS } from "@/lib/infoTipCopy";

interface DayPathDiagramProps {
  label: string;
  days: MemorizationDay[];
  completedDays: number;
  pathKey: string;
  sessionCheckpoints: Record<string, Record<string, number>>;
  onSelectDay: (dayNumber: number) => void;
  onPracticeDay: (dayNumber: number) => void;
  chapterLabel?: string;
  onNextChapter?: () => void;
  onPreviousChapter?: () => void;
}

const MILESTONE_EVERY = 5;

const navPillClass =
  "flex items-center gap-1 rounded-full bg-mist px-3 py-1.5 text-xs font-medium text-ink-soft hover:bg-line dark:bg-zinc-800 dark:text-zinc-300";

export function DayPathDiagram({
  label,
  days,
  completedDays,
  pathKey,
  sessionCheckpoints,
  onSelectDay,
  onPracticeDay,
  chapterLabel,
  onNextChapter,
  onPreviousChapter,
}: DayPathDiagramProps) {
  // completedDays is a path-wide counter, but `days` may be a single chapter's subset —
  // scope the visible count to what's actually rendered here.
  const visibleCompletedCount = days.filter((day) => day.dayNumber <= completedDays).length;
  const overallProgress = days.length > 0 ? visibleCompletedCount / days.length : 0;

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col items-center">
      {/* Consolidated, sticky banner — title, chapter progress, and path navigation stay
          visible instead of scrolling away above a long list of lesson nodes. */}
      <div className="sticky top-14 z-20 flex w-full flex-col items-center gap-2 bg-paper/95 px-8 pb-3 pt-4 backdrop-blur dark:bg-zinc-950/95">
        <h1 className="flex items-center gap-1.5 text-title">
          {label} <InfoTip text={INFO_TIPS.dayPathDiagram} />
        </h1>
        {chapterLabel && <p className="text-sm font-medium text-brand-600">{chapterLabel}</p>}
        <p className="text-sm text-ink-muted">
          {visibleCompletedCount} of {days.length} lessons complete
        </p>
        <div className="h-1.5 w-full max-w-[14rem] overflow-hidden rounded-full bg-mist dark:bg-zinc-700">
          <motion.div
            className="h-full rounded-full bg-brand-500"
            initial={{ width: 0 }}
            animate={{ width: `${overallProgress * 100}%` }}
            transition={{ duration: MOTION_DURATION.base }}
          />
        </div>
        <div className="mt-1 flex items-center gap-2">
          <Link href="/begin" className={navPillClass}>
            <Map size={13} /> Switch Path
          </Link>
          {onPreviousChapter && (
            <button type="button" onClick={onPreviousChapter} className={navPillClass}>
              <ChevronLeft size={13} /> Previous
            </button>
          )}
          {onNextChapter && (
            <button type="button" onClick={onNextChapter} className={navPillClass}>
              Next <ChevronRight size={13} />
            </button>
          )}
        </div>
      </div>
      <div className="flex flex-col items-center px-8 pb-8">
        {days.map((day, index) => {
          const isCompleted = day.dayNumber <= completedDays;
          const isUnlocked = day.dayNumber === completedDays + 1;
          const progress = isUnlocked
            ? getDayProgress(day, `${pathKey}:${day.dayNumber}`, sessionCheckpoints)
            : 0;
          const isMilestone = (index + 1) % MILESTONE_EVERY === 0 && index !== days.length - 1;

          return (
            <motion.div
              key={day.dayNumber}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: MOTION_DURATION.base }}
              className="flex flex-col items-center"
            >
              {index > 0 && <div className="h-8 w-1 bg-mist dark:bg-zinc-700" aria-hidden="true" />}
              <DayCircle
                day={day}
                isCompleted={isCompleted}
                isUnlocked={isUnlocked}
                progress={progress}
                offset={index % 2 === 0 ? "left" : "right"}
                onSelect={() => onSelectDay(day.dayNumber)}
                onPractice={() => onPracticeDay(day.dayNumber)}
              />
              {isMilestone && (
                <>
                  <div className="h-4 w-1 bg-mist dark:bg-zinc-700" aria-hidden="true" />
                  <PathMilestoneDivider count={index + 1} />
                </>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
