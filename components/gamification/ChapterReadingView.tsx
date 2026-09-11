"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useProgressStore } from "@/store/useProgressStore";
import type { ChapterPage } from "@/lib/chapterPagination";
import { useUniformFitText } from "@/lib/useUniformFitText";
import { FIXED_PARCHMENT_FONT_PX } from "@/lib/parchmentFontRange";
import { ChapterPageContent } from "@/components/gamification/ChapterPageContent";
import { ChapterFitProbes } from "@/components/gamification/ChapterFitProbes";
import { ParchmentCard } from "@/components/ui/ParchmentCard";

interface ChapterReadingViewProps {
  pages: ChapterPage[];
  pageIndex: number;
  goToPage: (index: number) => void;
  hasNext: boolean;
  hasPrevious: boolean;
  dayNumberByVerse: Map<number, number>;
  todaysVerseNumbers: Set<number>;
  completedDays: number;
  onSelectDay: (dayNumber: number) => void;
  onPracticeDay: (dayNumber: number) => void;
  // The card's own real measured available height — see useParchmentFillHeight.ts, measured
  // and owned by DayPathDiagram.tsx (the common parent of this view's own chrome and
  // PathBottomDock, both of which the measurement needs). Passed straight through to
  // ParchmentCard's own `fill` mode.
  fillHeightPx: number | null;
}

// Minimum horizontal drag (px) before a touch gesture counts as a page-flip swipe rather than
// an incidental wobble mid-tap or mid-vertical-scroll — see handleTouchEnd.
const SWIPE_THRESHOLD_PX = 50;

// The whole chapter, laid out on one fixed sheet of parchment (pagination/state itself lives
// in lib/useChapterPagination.ts, shared with DayPathDiagram.tsx's own top-bar page counter —
// this component is a controlled view over it, not the owner). Deliberately no scroll WITHIN
// a page — the sheet itself sits at a genuinely FIXED height (its own real measured available
// space — see useParchmentFillHeight.ts) rather than growing/shrinking with content, and the
// verse text's own font-size instead adapts to fill it — ONE size for the whole chapter, found
// by lib/useUniformFitText.ts against hidden probes of EVERY page at once (not just whichever
// page happens to be open), so flipping pages never changes the text's own size — only the
// smallest size any single page actually needs, so nothing overflows. A given verse still
// renders at the same coordinates on the page every time that SAME page is opened, which is
// what actually matters for the spatial/loci association pagination is meant to build — a
// scrollable page (or a size that jumped page to page) would still undermine that. A folded
// corner (top-right to go forward, top-left back) turns the page; so does a horizontal swipe
// anywhere on the parchment itself — no separate pill control at the bottom of the sheet, so
// the sheet's own text fills every bit of it instead of sharing the box with a nav row. Today's
// own verses are marked with a gold inline wash and number (see ChapterVerseRun.tsx's own state
// handling) — visible at a glance without moving a single word. A verse whose own lesson is
// already done gets a much quieter mark — its number turns brand-colored with a tiny checkmark;
// a verse not yet reached at all reads at reduced opacity. Every verse still opens its own
// owning lesson on tap — a finished one for review, a future one to preview.
export function ChapterReadingView({
  pages,
  pageIndex,
  goToPage,
  hasNext,
  hasPrevious,
  dayNumberByVerse,
  todaysVerseNumbers,
  completedDays,
  onSelectDay,
  onPracticeDay,
  fillHeightPx,
}: ChapterReadingViewProps) {
  const locationTags = useProgressStore((state) => state.locationTags);
  const iconTags = useProgressStore((state) => state.iconTags);
  const pegActive = useProgressStore((state) => state.pegSystemEnabled);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const probeContainerRef = useRef<HTMLDivElement>(null);
  const page = pages[pageIndex];
  const fontSizePx = useUniformFitText(probeContainerRef, [pages, fillHeightPx], {
    minPx: FIXED_PARCHMENT_FONT_PX,
    maxPx: FIXED_PARCHMENT_FONT_PX,
  });

  function handleClick(dayNumber: number | undefined) {
    if (dayNumber === undefined) return;
    if (dayNumber <= completedDays) onPracticeDay(dayNumber);
    else onSelectDay(dayNumber);
  }

  function handleTouchStart(event: React.TouchEvent) {
    const touch = event.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY };
  }

  function handleTouchEnd(event: React.TouchEvent) {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start) return;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    // Mostly-horizontal only — a mostly-vertical drag is the page's own scroll, not a flip.
    if (Math.abs(dx) < SWIPE_THRESHOLD_PX || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    if (dx < 0) goToPage(pageIndex + 1);
    else goToPage(pageIndex - 1);
  }

  const pageContentProps = { dayNumberByVerse, todaysVerseNumbers, completedDays, locationTags, iconTags, pegActive };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-3">
      <ChapterFitProbes ref={probeContainerRef} pages={pages} fillHeightPx={fillHeightPx} {...pageContentProps} />

      <ParchmentCard fill fillHeightPx={fillHeightPx}>
        {hasNext && (
          <button
            type="button"
            onClick={() => goToPage(pageIndex + 1)}
            aria-label="Next page"
            className="absolute right-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-ink-soft shadow-sm transition-colors hover:bg-white hover:text-brand-600 dark:bg-zinc-800/85 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            <ChevronRight size={18} />
          </button>
        )}
        {hasPrevious && (
          <button
            type="button"
            onClick={() => goToPage(pageIndex - 1)}
            aria-label="Previous page"
            className="absolute left-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-ink-soft shadow-sm transition-colors hover:bg-white hover:text-brand-600 dark:bg-zinc-800/85 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            <ChevronLeft size={18} />
          </button>
        )}

        <div onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
          {/* Plain instant swap, not an animated page-turn — AnimatePresence's exit/enter
              cycle here proved unreliable (the DOM would sometimes get stuck mid-transition
              showing the outgoing page's text under the new page's own fold/counter), and a
              correct instant page beats a broken animated one. */}
          <div key={pageIndex}>
            <ChapterPageContent page={page} {...pageContentProps} fontSizePx={fontSizePx} onSelect={handleClick} />
          </div>
        </div>
      </ParchmentCard>
    </div>
  );
}
