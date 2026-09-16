"use client";

import { useEffect, useMemo, useState } from "react";
import type { MemorizationDay } from "@/types";
import { versesByPericopeSegment } from "@/lib/pathZones";
import { paginateSegments, pageIndexForVerse, type ChapterPage } from "@/lib/chapterPagination";
import { resolvePageBudget, type PageBudget } from "@/lib/pageBudget";
import { usePericopesReady } from "@/lib/usePericopesReady";

// The reading view's per-page budget depends on the viewport's own WIDTH (see
// resolvePageBudget's doc comment) and the parchment card's own ACTUAL measured available
// HEIGHT — the latter comes in as `fillHeightPx` (see useParchmentFillHeight.ts, the real
// measurement DayPathDiagram.tsx feeds this hook) rather than being derived here, so pagination
// always agrees with whatever height the card is really about to render at. Width starts at 0,
// which resolvePageBudget floors to a small pre-mount fallback (matching what the server
// renders, so hydration has nothing to reconcile), and corrects itself once mounted, via a
// `resize`-driven check rather than a one-shot read, so rotating a device or resizing a window
// re-paginates live instead of freezing in whichever width was true on load.
function useResponsivePageBudget(fillHeightPx: number | null): PageBudget {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    function readWidth() {
      setWidth(window.innerWidth);
    }
    readWidth();
    window.addEventListener("resize", readWidth);
    return () => window.removeEventListener("resize", readWidth);
  }, []);
  // Packs for the one fixed size every parchment renders at (resolvePageBudget's own default —
  // see lib/parchmentFontRange.ts).
  return resolvePageBudget(width, fillHeightPx ?? 0);
}

export interface ChapterPagination {
  pages: ChapterPage[];
  pageIndex: number;
  goToPage: (index: number) => void;
  hasNext: boolean;
  hasPrevious: boolean;
  dayNumberByVerse: Map<number, number>;
  todaysVerseNumbers: Set<number>;
  // The real line budget this chapter was just paginated against — exposed so a caller that
  // needs to paginate a SEPARATE, smaller window of the same verses (LearnSection.tsx's own
  // per-stage `paginateVerseWindow` calls, rendered on the very same fixed-size parchment card
  // via this same hook's own `fillHeightPx`/`fontSizePx`) reuses the identical budget instead
  // of recomputing its own — two windows of the same card only stay pixel-identical if they're
  // packed against the exact same numbers.
  pageBudget: PageBudget;
}

// The one shared source of "which page is open" for a chapter's parchment reading view —
// pulled out of ChapterReadingView.tsx so DayPathDiagram.tsx's own top bar (which needs the
// live page count/index for its "Page X of Y" indicator — see the Path UI mockup) and
// ChapterReadingView (which needs the same state to actually render/flip pages) share one
// real piece of state instead of two components each keeping their own copy that could drift
// apart. DayPathDiagram is the common parent of both, so it's the one that calls this hook and
// hands pieces of the result down as props — ChapterReadingView itself takes pageIndex/goToPage
// as controlled props rather than owning this state.
export function useChapterPagination(
  days: MemorizationDay[],
  completedDays: number,
  todaysDay: number,
  fillHeightPx: number | null,
): ChapterPagination {
  const learnDays = useMemo(() => days.filter((day) => day.kind === "learn"), [days]);
  const verses = useMemo(() => learnDays.flatMap((day) => day.newVerses), [learnDays]);
  const dayNumberByVerse = useMemo(() => {
    const map = new Map<number, number>();
    for (const day of learnDays) {
      for (const verse of day.newVerses) map.set(verse.verseNumber, day.dayNumber);
    }
    return map;
  }, [learnDays]);
  // null wherever this chapter's pericope headings aren't cached yet — degrades to one
  // unheaded page for the whole chapter, same "decorative, never blocking" convention every
  // other pericope consumer in this codebase follows. `pericopesReady` isn't read directly
  // below — it's here purely so this memo RECOMPUTES once the fetch lands, rather than
  // staying stuck on whatever `versesByPericopeSegment` returned on the render that happened
  // to run before the cache was warm (a caller that doesn't itself gate on
  // lib/usePericopesReady.ts before mounting this hook — e.g. LearnSection.tsx, unlike
  // PathOverviewScreen.tsx/SrsReviewSession.tsx, which already wait — would otherwise be
  // permanently stuck on the heading-less, differently-paginated fallback for that whole
  // mount, since nothing else here ever re-runs this computation).
  const pericopesReady = usePericopesReady(verses);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- pericopesReady deliberately unread below; see doc comment above.
  const segments = useMemo(() => versesByPericopeSegment(verses), [verses, pericopesReady]);
  const pageBudget = useResponsivePageBudget(fillHeightPx);
  const pages = useMemo(
    () =>
      paginateSegments(
        segments ?? [{ key: "whole", label: "", heading: "", verses, book: "", chapter: 0, startVerse: 0, endVerse: 0 }],
        pageBudget,
      ),
    [segments, verses, pageBudget],
  );
  // todaysDay (see lib/dayRollover.ts's todaysDayNumber) is always a real dayNumber, whether
  // or not that lesson has actually been learned yet — so the gold highlight below keeps
  // marking today's own verses even after they're done, rather than vanishing the moment the
  // lesson finishes.
  const todaysLearnDay = useMemo(() => learnDays.find((day) => day.dayNumber === todaysDay), [learnDays, todaysDay]);
  const todaysVerseNumbers = useMemo(
    () => new Set(todaysLearnDay?.newVerses.map((verse) => verse.verseNumber) ?? []),
    [todaysLearnDay],
  );

  const [pageIndex, setPageIndex] = useState(0);

  // Opens straight to whichever page holds today's own lesson (or the chapter's last page,
  // once it's all done). Recomputed and compared during render, not in an effect, per this
  // codebase's own "adjusting state when a prop changes" convention (see
  // PathOverviewScreen.tsx's chapterOverride) — keyed on the chapter + completedDays/todaysDay
  // specifically, not on pageIndex itself, so it only overrides a manual page flip when the
  // chapter, a completion, or today's own lesson actually changes underneath it.
  const anchorVerse = todaysLearnDay?.newVerses[0]?.verseNumber ?? verses[verses.length - 1]?.verseNumber;
  const anchorKey = `${verses[0]?.book ?? ""}|${verses[0]?.chapter ?? ""}|${completedDays}|${todaysDay}`;
  const [lastAnchorKey, setLastAnchorKey] = useState(anchorKey);
  if (lastAnchorKey !== anchorKey) {
    setLastAnchorKey(anchorKey);
    if (anchorVerse !== undefined) setPageIndex(pageIndexForVerse(pages, anchorVerse));
  }

  function goToPage(nextIndex: number) {
    if (nextIndex < 0 || nextIndex >= pages.length) return;
    setPageIndex(nextIndex);
  }

  return {
    pages,
    pageIndex,
    goToPage,
    hasNext: pageIndex < pages.length - 1,
    hasPrevious: pageIndex > 0,
    dayNumberByVerse,
    todaysVerseNumbers,
    pageBudget,
  };
}
