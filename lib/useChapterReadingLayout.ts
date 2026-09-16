"use client";

import { useRef } from "react";
import type { MemorizationDay } from "@/types";
import { useProgressStore } from "@/store/useProgressStore";
import { useChapterPagination, type ChapterPagination } from "@/lib/useChapterPagination";
import { useUniformFitText } from "@/lib/useUniformFitText";
import { FIXED_PARCHMENT_FONT_PX } from "@/lib/parchmentFontRange";
import { useParchmentFillHeight } from "@/lib/useParchmentFillHeight";

export interface ChapterReadingLayout extends ChapterPagination {
  fontSizePx: number;
  fillHeightPx: number | null;
  // Echoed straight back from this hook's own `completedDays` argument — kept on the returned
  // object too since ChapterPageContent.tsx needs it alongside everything else here to render
  // a page's own verse-run states, and a caller building one is otherwise stuck threading it
  // separately from every other piece of this same layout.
  completedDays: number;
  bodyTopRef: React.RefObject<HTMLDivElement | null>;
  dockRef: React.RefObject<HTMLDivElement | null>;
  probeContainerRef: React.RefObject<HTMLDivElement | null>;
  locationTags: Record<string, string>;
  iconTags: Record<string, string>;
  pegActive: boolean;
}

// Everything the Path screen's own reading view (ChapterReadingView.tsx, via DayPathDiagram.tsx)
// computes to lay out one chapter's worth of parchment — pages, which one's open, and the ONE
// uniform font size every page shares — pulled out into its own hook so a Learn/Review screen
// can call it with the SAME inputs (this chapter's own day plan, completedDays, todaysDay) and
// get back the LITERALLY IDENTICAL result: same pages, same font size, same fill height. Two
// screens computing the same deterministic function of the same inputs always agree, without
// either one needing the other to still be mounted or to prop-drill a live value across a route
// boundary. `bodyTopRef`/`dockRef` (see useParchmentFillHeight.ts) still need to be attached by
// the caller to its own real top-chrome and bottom-dock elements — this hook only measures,
// it never assumes those elements' own shape, so a lesson screen's differently-shaped chrome
// (LessonTopBar, LessonControlBar.tsx) still gets a real, correct fillHeightPx as long as
// LessonTopBar stays the exact same rendered height as DayPathDiagram's own top bar/progress
// bar (see LessonTopBar.tsx's own doc comment) — LessonControlBar's own height no longer
// matters to this beyond being a real, measured `dockRef` height like PathBottomDock's own
// already was, now that useParchmentFillHeight.ts computes `fillHeightPx` with the exact SAME
// formula for every caller (no more Learn-flow-only `splitDock` branch — see that hook's own
// doc comment on why that used to let the same chapter paginate differently depending on where
// it was opened). `probeContainerRef` still needs rendering by the caller too (see
// ChapterFitProbes.tsx) — a hook can compute state, never render JSX.
export function useChapterReadingLayout(days: MemorizationDay[], completedDays: number, todaysDay: number): ChapterReadingLayout {
  const locationTags = useProgressStore((state) => state.locationTags);
  const iconTags = useProgressStore((state) => state.iconTags);
  const pegActive = useProgressStore((state) => state.pegSystemEnabled);
  const { bodyTopRef, dockRef, fillHeightPx } = useParchmentFillHeight();
  const pagination = useChapterPagination(days, completedDays, todaysDay, fillHeightPx);
  const probeContainerRef = useRef<HTMLDivElement>(null);
  // Pinned to the one fixed size every parchment renders at (see lib/parchmentFontRange.ts) —
  // pagination itself (a verse now free to split across the page break) is what fills every
  // page at that size, not a font search shrinking text to make room.
  const fontSizePx = useUniformFitText(probeContainerRef, [pagination.pages, fillHeightPx], {
    minPx: FIXED_PARCHMENT_FONT_PX,
    maxPx: FIXED_PARCHMENT_FONT_PX,
  });

  return { ...pagination, fontSizePx, fillHeightPx, completedDays, bodyTopRef, dockRef, probeContainerRef, locationTags, iconTags, pegActive };
}
