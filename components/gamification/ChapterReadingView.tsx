"use client";

import { useRef } from "react";
import { useProgressStore } from "@/store/useProgressStore";
import type { ChapterPage } from "@/lib/chapterPagination";
import { useUniformFitText } from "@/lib/useUniformFitText";
import { FIXED_PARCHMENT_FONT_PX } from "@/lib/parchmentFontRange";
import { computeGhostContext } from "@/lib/ghostContext";
import { ChapterPageContent } from "@/components/gamification/ChapterPageContent";
import { ChapterFitProbes } from "@/components/gamification/ChapterFitProbes";
import { PericopeTitle } from "@/components/gamification/PericopeTitle";
import { GhostContextLine } from "@/components/gamification/GhostContextLine";
import { ParchmentCard } from "@/components/ui/ParchmentCard";

interface ChapterReadingViewProps {
  pages: ChapterPage[];
  pageIndex: number;
  goToPage: (index: number) => void;
  dayNumberByVerse: Map<number, number>;
  todaysVerseNumbers: Set<number>;
  completedDays: number;
  onSelectDay: (dayNumber: number) => void;
  onPracticeDay: (dayNumber: number) => void;
  // The card's own real measured available height — see useParchmentFillHeight.ts, measured
  // and owned by DayPathDiagram.tsx (the common parent of this view's own chrome and
  // PathBottomDock, both of which the measurement needs). Feeds lib/useUniformFitText.ts's own
  // font-fit measurement below (the largest font every page can still fit inside this budget),
  // not the card's own rendered height — the card itself auto-sizes to whatever a given page
  // actually holds (see ParchmentCard below).
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
// smallest size any single page actually needs, so nothing overflows. Turning the page is
// swipe-only — a horizontal drag anywhere on the parchment — deliberately with no floating
// arrow buttons over the text itself, so nothing ever sits on top of the one thing a reader's
// spatial memory is meant to anchor to. A given verse still renders at the same coordinates on
// the page every time that SAME page is opened, which is what actually matters for the spatial/
// loci association pagination is meant to build. Today's own verses are marked with a brand-
// colored inline underline and number (see SenseLineVerse.tsx's own state handling) — visible at a
// glance without moving a single word. A verse whose own lesson is already done gets a much
// quieter mark — its number turns brand-colored; a verse not yet reached at all reads at
// reduced opacity. Every verse still opens its own owning lesson on tap — a finished one for
// review, a future one to preview.
export function ChapterReadingView({
  pages,
  pageIndex,
  goToPage,
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

  const { previousEdgeVerse, nextEdgeVerse, prevGhostText, nextGhostText } = computeGhostContext(pages, pageIndex);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-3">
      <ChapterFitProbes ref={probeContainerRef} pages={pages} fillHeightPx={fillHeightPx} {...pageContentProps} />

      <PericopeTitle
        book={page?.segments[0]?.book}
        chapter={page?.segments[0]?.chapter}
        verseNumber={page?.segments[0]?.verses[0]?.verseNumber}
        heading={page?.segments[0]?.heading}
      />

      <GhostContextLine
        verse={previousEdgeVerse}
        text={prevGhostText}
        ellipsis="leading"
        align="left"
        onNavigate={pageIndex > 0 ? () => goToPage(pageIndex - 1) : undefined}
      />

      {/* No longer `fill` — the card now sizes to THIS page's own real content instead of
          always stretching to the full measured available height (fillHeightPx above still
          feeds the font-fit measurement below, just not the card's own rendered height), so its
          top-left corner stays anchored right where it always sat while its bottom-right corner
          moves with however much this page actually holds — which is what the right-aligned NEXT
          GhostContextLine right below lines itself up under. */}
      <ParchmentCard>
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

      <GhostContextLine
        verse={nextEdgeVerse}
        text={nextGhostText}
        ellipsis="trailing"
        align="right"
        onNavigate={pageIndex < pages.length - 1 ? () => goToPage(pageIndex + 1) : undefined}
      />
    </div>
  );
}
