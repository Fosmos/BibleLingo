"use client";

import { useEffect, useRef, type RefObject } from "react";
import { useLessonSessionStore } from "@/store/useLessonSessionStore";

// Owned by LessonBottomSheet.tsx's own dedicated "sense lines only" card — attaches to that
// card's real DOM node, publishes it (and its own real measured width/height) to
// store/useLessonSessionStore.ts so LessonPageCard.tsx (mounted deep inside whichever drill is
// currently active, with no prop path back up to this sheet) can portal its card straight into
// it. Re-measures on resize (the card's own `h-[40dvh]` tracks the real viewport) so a rotate/
// resize keeps `senseCardFillHeightPx`/`senseCardColumnWidthPx` — and so pagination — correct.
export function useMindMapSenseCardSlot(): RefObject<HTMLDivElement | null> {
  const slotRef = useRef<HTMLDivElement>(null);
  const setSenseCardPortalNode = useLessonSessionStore((state) => state.setSenseCardPortalNode);
  const setSenseCardFillHeightPx = useLessonSessionStore((state) => state.setSenseCardFillHeightPx);
  const setSenseCardColumnWidthPx = useLessonSessionStore((state) => state.setSenseCardColumnWidthPx);

  useEffect(() => {
    const el = slotRef.current;
    setSenseCardPortalNode(el);
    if (!el) return;
    function measure() {
      if (!el) return;
      // The whole sheet's height, not this zone's: the zone now sizes itself to its content (see
      // LessonBottomSheet.tsx), so its own height would feed pagination a moving, often tiny,
      // target. The sheet only ever shows a stage's own verses anyway (never a paginated page).
      setSenseCardFillHeightPx(el.parentElement?.clientHeight ?? el.clientHeight);
      setSenseCardColumnWidthPx(el.clientWidth);
    }
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    if (el.parentElement) observer.observe(el.parentElement);
    return () => {
      observer.disconnect();
      setSenseCardPortalNode(null);
      setSenseCardFillHeightPx(null);
      setSenseCardColumnWidthPx(null);
    };
  }, [setSenseCardPortalNode, setSenseCardFillHeightPx, setSenseCardColumnWidthPx]);

  return slotRef;
}
