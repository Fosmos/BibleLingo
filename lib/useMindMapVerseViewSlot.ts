"use client";

import { useEffect, useRef, type RefObject } from "react";
import { useLessonSessionStore } from "@/store/useLessonSessionStore";

// Owned by MindMapSheetBreadcrumb.tsx — attaches to its own reference-lookup slot's real DOM
// node, publishes it to store/useLessonSessionStore.ts so LessonControlBar.tsx (mounted deep
// inside whichever drill is currently active, with no prop path back up to this breadcrumb) can
// portal its "View First Letters"/"View Verse" pair straight into it instead of rendering them
// among the sheet's own 20dvh essential-drill controls. Same shape as
// lib/useMindMapSenseCardSlot.ts, minus that hook's own width/height measuring — this slot just
// needs to exist, not be sized against.
export function useMindMapVerseViewSlot(): RefObject<HTMLDivElement | null> {
  const slotRef = useRef<HTMLDivElement>(null);
  const setVerseViewPortalNode = useLessonSessionStore((state) => state.setVerseViewPortalNode);

  useEffect(() => {
    setVerseViewPortalNode(slotRef.current);
    return () => setVerseViewPortalNode(null);
  }, [setVerseViewPortalNode]);

  return slotRef;
}
