"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { MOTION_DURATION } from "@/lib/motionTokens";

interface LessonTopBarProps {
  label: string;
  version: string;
  current: number;
  total: number;
  // Set only by the in-place lesson flow (DaySessionController.tsx) — "Back" calls this
  // instead of router.back(), which would leave the parchment page entirely (there's no new
  // route to go "back" from anymore — see PathOverviewScreen.tsx's own in-place lesson state).
  onExit?: () => void;
}

// The exact same chrome shape as the Path screen's own reading view (see
// DayPathDiagram.tsx's top bar + progress bar) — Back, "BOOK CHAPTER • VERSION" centered,
// a right-aligned counter, then an edge-to-edge progress bar — reused here so a lesson's own
// parchment sits at the identical height on screen as the reading view's, rather than a
// pile of stage labels/testing buttons pushing it further down every time the stage changes.
// The one thing this app's every other lesson-flow screen (Boss Battle, Chapter Review, ...)
// still doesn't share yet — see LearnSection.tsx's own doc comment on why this pass scoped
// to just the Learn stages first.
export function LessonTopBar({ label, version, current, total, onExit }: LessonTopBarProps) {
  const router = useRouter();
  const progressFraction = total > 0 ? current / total : 0;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pt-4">
      <div className="flex items-center justify-between gap-2 pb-1">
        <button
          type="button"
          onClick={onExit ?? (() => router.back())}
          className="flex shrink-0 items-center gap-1 text-sm font-medium text-ink-muted hover:text-brand-600"
        >
          <ChevronLeft size={16} /> Back
        </button>
        <p className="flex-1 truncate text-center text-sm font-semibold uppercase tracking-wide text-ink-soft dark:text-zinc-300">
          {label} <span className="text-ink-muted">• {version}</span>
        </p>
        <span className="shrink-0 text-xs font-medium text-ink-muted">
          Stage {current} of {total}
        </span>
      </div>
      <div
        className="h-1.5 w-full rounded-full bg-mist dark:bg-zinc-800"
        role="progressbar"
        aria-valuenow={Math.round(progressFraction * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <motion.div
          className="h-full rounded-full bg-brand-500"
          initial={{ width: 0 }}
          animate={{ width: `${progressFraction * 100}%` }}
          transition={{ duration: MOTION_DURATION.base }}
        />
      </div>
    </div>
  );
}
