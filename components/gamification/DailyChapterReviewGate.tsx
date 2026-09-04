"use client";

import { useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import type { VerseSegment } from "@/types";
import { useProgressStore } from "@/store/useProgressStore";
import { todayDateKey } from "@/lib/dateKey";
import { TAP_SCALE } from "@/lib/motionTokens";
import { ChapterReviewStage } from "@/components/drills/ChapterReviewStage";

interface DailyChapterReviewGateProps {
  pathKey: string;
  label: string;
  // Everything already memorized in the chapter the reader is currently working through —
  // NOT including today's still-upcoming new verses (see PathOverviewScreen.tsx). Empty
  // means there's nothing to review yet (e.g. the very first verse of a fresh chapter), so
  // the gate never blocks on an empty review.
  verses: VerseSegment[];
  children: ReactNode;
}

// Building view's once-a-day chapter recap: the first time the reader opens the path screen
// on a given calendar day (see lib/dateKey.ts), this gate shows the chapter they're
// currently working through — words, then a spoken recitation, then a results screen (see
// ChapterReviewStage.tsx, this is its only caller) — before letting them into the room view
// underneath. Skippable at any time; skipping or finishing both mark today as reviewed the
// same way, so it never shows twice in one day either way.
export function DailyChapterReviewGate({ pathKey, label, verses, children }: DailyChapterReviewGateProps) {
  const lastReviewDate = useProgressStore((state) => state.buildingViewLastReviewDate);
  const markReviewedToday = useProgressStore((state) => state.markBuildingViewReviewedToday);
  const [dismissed, setDismissed] = useState(false);

  const alreadyReviewedToday = lastReviewDate === todayDateKey();
  const shouldShow = verses.length > 0 && !alreadyReviewedToday && !dismissed;

  if (!shouldShow) return <>{children}</>;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-6">
      <div className="flex items-center justify-between gap-2">
        <p className="text-caption font-semibold uppercase tracking-wide text-brand-500">Today&apos;s Chapter Recap</p>
        <motion.button
          type="button"
          whileTap={TAP_SCALE}
          onClick={() => {
            markReviewedToday();
            setDismissed(true);
          }}
          className="rounded-full bg-mist px-3 py-1.5 text-xs font-medium text-ink-soft hover:bg-line dark:bg-zinc-800 dark:text-zinc-300"
        >
          Skip for now
        </motion.button>
      </div>
      <ChapterReviewStage
        pathKey={pathKey}
        label={label}
        verses={verses}
        onComplete={() => {
          markReviewedToday();
          setDismissed(true);
        }}
      />
    </div>
  );
}
