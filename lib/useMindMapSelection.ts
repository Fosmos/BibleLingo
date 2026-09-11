"use client";

import { useState } from "react";

export interface MindMapSelection {
  chapterOverride: number | null;
  // Which verse a Mind Map pericope tap wants that chapter's own real page to open straight
  // to (see DayPathDiagram.tsx's own targetVerse prop) — always set alongside chapterOverride,
  // and cleared whenever chapterOverride changes any other way (chapter-level nav has no
  // specific verse in mind, so it should fall back to the normal "today's lesson" anchor).
  targetVerse: number | undefined;
  setChapterOverride: (chapter: number | null) => void;
  selectPericope: (chapter: number, startVerse?: number) => void;
  reset: () => void;
}

// Book mode's own nav between its two screens (the Mind Map vs a chapter's parchment view)
// bundled with the specific verse a pericope tap wants that page to open to — split out of
// PathOverviewScreen.tsx purely to keep that file under this codebase's 200-line cap.
export function useMindMapSelection(): MindMapSelection {
  const [chapterOverride, setChapterOverrideRaw] = useState<number | null>(null);
  const [targetVerse, setTargetVerse] = useState<number | undefined>(undefined);

  return {
    chapterOverride,
    targetVerse,
    setChapterOverride: (chapter) => {
      setChapterOverrideRaw(chapter);
      setTargetVerse(undefined);
    },
    selectPericope: (chapter, startVerse) => {
      setChapterOverrideRaw(chapter);
      setTargetVerse(startVerse);
    },
    reset: () => {
      setChapterOverrideRaw(null);
      setTargetVerse(undefined);
    },
  };
}
