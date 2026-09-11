"use client";

import { useState } from "react";
import { pageIndexForVerse, type ChapterPage } from "@/lib/chapterPagination";

// Overrides useChapterPagination's own "today's lesson" default the instant a NEW
// targetVerse arrives (DayPathDiagram.tsx's own prop, set by a fresh Mind Map pericope tap —
// see PathOverviewScreen.tsx) — adjusting state during render, not an effect, same "adjusting
// state when a prop changes" pattern useChapterPagination's own anchorKey already follows.
// Keyed on `${targetVerse}-${pages.length}`, not just targetVerse: DayPathDiagram is a FRESH
// MOUNT every time a pericope tap changes which chapter is showing, and `pages` itself can
// still be mid-settle right then (pericope data not cached yet degrades to a single, much
// coarser page split — see useChapterPagination.ts's own doc comment) — applying the override
// against that TEMPORARY page count, then never re-checking once `pages` itself updates to
// its real, final shape, left `goToPage` pointed at an index that no longer existed. Re-
// keying on pages.length too makes it re-apply once pagination actually settles, the same way
// it re-applies for a genuinely new targetVerse.
export function useTargetVerseOverride(pages: ChapterPage[], targetVerse: number | undefined, goToPage: (index: number) => void): void {
  const key = targetVerse === undefined ? undefined : `${targetVerse}-${pages.length}`;
  const [lastKey, setLastKey] = useState<string | undefined>(undefined);
  if (key !== undefined && key !== lastKey) {
    setLastKey(key);
    goToPage(pageIndexForVerse(pages, targetVerse as number));
  }
}
