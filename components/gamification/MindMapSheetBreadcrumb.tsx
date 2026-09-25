"use client";

import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { MOTION_DURATION, MOTION_EASE } from "@/lib/motionTokens";
import { useLessonSessionStore } from "@/store/useLessonSessionStore";
import { usePericopeHeading } from "@/lib/usePericopeHeading";
import { useMindMapVerseViewSlot } from "@/lib/useMindMapVerseViewSlot";

interface MindMapSheetBreadcrumbProps {
  book: string;
  chapter: number;
  verseNumber: number;
  onExit: () => void;
}

// The in-place lesson bottom sheet's own ONE piece of chrome (see BookMindMapWithLessonSheet.tsx)
// — fixed to the true top of the page, above both the shrunk Mind Map canvas and the sheet
// itself, rather than living inside the sheet the way LearnVerseSpotlightChrome.tsx's own
// breadcrumb still does for the standalone `/day/[dayNumber]` route (see that component's own
// `embeddedInMindMap` branch, which now renders nothing in this context instead). Just Chapter
// -> Pericope (see lib/usePericopeHeading.ts) — e.g. "Ch 13 -> Signs of the End of the Age" —
// never the book name or its wider literary-section theme, since this sheet only ever runs for
// the currently active book and a reader mid-drill doesn't need either to know where they are.
// Its trailing slot is LessonControlBar.tsx's own reference-lookup pair ("View First Letters"/
// "View Verse") portaled in via lib/useMindMapVerseViewSlot.ts — this bar's the natural home for
// a neutral lookup with no bearing on the drill itself, freeing the sheet's own 20dvh controls
// zone below for just what a stage actually needs to be worked.
export function MindMapSheetBreadcrumb({ book, chapter, verseNumber, onExit }: MindMapSheetBreadcrumbProps) {
  const pericopeHeading = usePericopeHeading(book, chapter, verseNumber);
  const trail = [`Ch ${chapter}`, pericopeHeading].filter((segment): segment is string => Boolean(segment));
  const verseViewSlotRef = useMindMapVerseViewSlot();
  // Set only mid-lesson (see LearnTopBar.tsx) — null for the verse preview.
  const lessonProgress = useLessonSessionStore((state) => state.lessonProgress);

  return (
    <div className="fixed inset-x-0 top-0 z-40 flex items-center gap-2 border-b border-line bg-white/95 px-4 pb-2 pt-[calc(0.5rem+env(safe-area-inset-top))] backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95">
      <button
        type="button"
        onClick={onExit}
        className="flex shrink-0 items-center gap-1 text-sm font-medium text-ink-muted hover:text-brand-600"
      >
        <ChevronLeft size={16} /> Back
      </button>
      <p className="flex-1 truncate text-center text-xs font-medium uppercase tracking-wide text-ink-muted dark:text-zinc-500">
        {trail.join(" → ")}
      </p>
      <div ref={verseViewSlotRef} className="flex shrink-0 items-center gap-2" />
      {lessonProgress !== null && (
        <div className="absolute inset-x-0 bottom-0 h-1 bg-line/60 dark:bg-zinc-800" aria-hidden="true">
          <motion.div
            className="h-full bg-brand-500"
            initial={false}
            animate={{ width: `${Math.round(lessonProgress * 100)}%` }}
            transition={{ duration: MOTION_DURATION.base, ease: MOTION_EASE.enter }}
          />
        </div>
      )}
    </div>
  );
}
