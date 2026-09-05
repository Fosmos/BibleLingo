"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Map, ChevronLeft, ChevronRight, FlaskConical } from "lucide-react";
import type { MemorizationDay } from "@/types";
import { useProgressStore } from "@/store/useProgressStore";
import { applyDayCompletion } from "@/lib/completeDayEffects";
import { MOTION_DURATION } from "@/lib/motionTokens";
import { PathDayList } from "@/components/gamification/PathDayList";
import { BuildingRoomView } from "@/components/gamification/BuildingRoomView";
import { InfoTip } from "@/components/ui/InfoTip";
import { INFO_TIPS } from "@/lib/infoTipCopy";

interface DayPathDiagramProps {
  label: string;
  days: MemorizationDay[];
  // The path's FULL, unscoped day list — book mode's `days` prop above may be narrowed to just
  // the currently-viewed chapter, but "Next day (testing)" always needs to find whichever day
  // is globally next regardless of which chapter happens to be in view.
  allDays: MemorizationDay[];
  completedDays: number;
  pathKey: string;
  onSelectDay: (dayNumber: number) => void;
  onPracticeDay: (dayNumber: number) => void;
  // Book mode only: fraction (0-1) of the current chapter's own verses memorized so far —
  // shown as a "N% Memorized" bar instead of the plain lessons-complete count/bar every
  // other path kind gets, and folded together with the chapter number into `label` itself
  // (e.g. "Mark 14") rather than a separate "Chapter 14 of 16" line — see
  // PathOverviewScreen.tsx.
  chapterMemorizedFraction?: number;
  onNextChapter?: () => void;
  onPreviousChapter?: () => void;
}

const navPillClass =
  "flex items-center gap-1 rounded-full bg-mist px-3 py-1.5 text-xs font-medium text-ink-soft hover:bg-line dark:bg-zinc-800 dark:text-zinc-300";

// The path view's header (progress + nav) plus its body — either a plain lesson-circle list
// grouped into memory-loci "rooms" (see components/gamification/PathDayList.tsx), or, when
// the "Building path view" setting is on, BuildingRoomView's one-room-per-screen chapter ->
// building, pericope -> room, verse -> item hierarchy.
export function DayPathDiagram({
  label,
  days,
  allDays,
  completedDays,
  pathKey,
  onSelectDay,
  onPracticeDay,
  chapterMemorizedFraction,
  onNextChapter,
  onPreviousChapter,
}: DayPathDiagramProps) {
  const buildingViewEnabled = useProgressStore((state) => state.buildingViewEnabled);
  const nextDay = allDays.find((candidate) => candidate.dayNumber === completedDays + 1);
  // completedDays is a path-wide counter, but `days` may be a single chapter's subset —
  // scope the visible count to what's actually rendered here.
  const visibleCompletedCount = days.filter((day) => day.dayNumber <= completedDays).length;
  const overallProgress = days.length > 0 ? visibleCompletedCount / days.length : 0;
  const progressFraction = chapterMemorizedFraction ?? overallProgress;
  const progressLabel =
    chapterMemorizedFraction !== undefined ? `${Math.round(chapterMemorizedFraction * 100)}% Memorized` : `${visibleCompletedCount} of ${days.length} lessons complete`;

  return (
    <div className="flex flex-1 flex-col">
      <div className="z-20 flex w-full flex-col items-center gap-2 px-8 pb-3 pt-4">
        <h1 className="flex items-center gap-1.5 text-title">
          {label} <InfoTip text={INFO_TIPS.dayPathDiagram} />
        </h1>
        <p className="text-sm text-ink-muted">{progressLabel}</p>
        <div className="h-1.5 w-full max-w-[14rem] overflow-hidden rounded-full bg-mist dark:bg-zinc-700">
          <motion.div
            className="h-full rounded-full bg-brand-500"
            initial={{ width: 0 }}
            animate={{ width: `${progressFraction * 100}%` }}
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
          {nextDay && (
            <button type="button" onClick={() => applyDayCompletion(pathKey, nextDay)} className={navPillClass}>
              <FlaskConical size={13} /> Next day (testing)
            </button>
          )}
        </div>
      </div>
      {buildingViewEnabled ? (
        <BuildingRoomView days={days} completedDays={completedDays} pathKey={pathKey} onSelectDay={onSelectDay} onPracticeDay={onPracticeDay} />
      ) : (
        <PathDayList days={days} completedDays={completedDays} onSelectDay={onSelectDay} onPracticeDay={onPracticeDay} />
      )}
    </div>
  );
}
