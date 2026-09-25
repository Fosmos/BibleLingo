"use client";

import { useEffect, useRef, type RefObject } from "react";
import { useLessonSessionStore } from "@/store/useLessonSessionStore";

// Owned by LessonBottomSheet.tsx — publishes its drill zone's real DOM node so
// SheetDrillPortal.tsx (used deep inside whichever stage is active, with no prop path back up)
// can render that stage's controls straight into it. Same shape as lib/useMindMapVerseViewSlot.ts.
export function useMindMapDrillSlot(): RefObject<HTMLDivElement | null> {
  const slotRef = useRef<HTMLDivElement>(null);
  const setDrillPortalNode = useLessonSessionStore((state) => state.setDrillPortalNode);

  useEffect(() => {
    setDrillPortalNode(slotRef.current);
    return () => setDrillPortalNode(null);
  }, [setDrillPortalNode]);

  return slotRef;
}
