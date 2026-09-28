"use client";

import { useLayoutEffect, type RefObject } from "react";
import type { ReactZoomPanPinchRef } from "react-zoom-pan-pinch";
import { isPericopeNode, type MindMapLayout } from "@/lib/mindMapLayoutTypes";
import { useLessonSessionStore } from "@/store/useLessonSessionStore";

interface UseMindMapArrivalArgs {
  layout: MindMapLayout;
  wrapperRef: RefObject<HTMLDivElement | null>;
  transformRef: RefObject<ReactZoomPanPinchRef | null>;
}

// Where on the screen the arrived-at verse lands — the same spot "Back to my place" uses.
const TARGET_HEIGHT_FRACTION = 0.4;

// Brings the store's arrivalVerse into view once (Home's Needs Reviewing links — see
// lib/useReviewArrival.ts), then clears it so the view is free again. Its chapter is opened by
// useMindMapFollowFocusBranch (BookMindMap.tsx feeds it the arrival verse too), fetching another
// book first when needed; this waits until that verse's chip is laid out. Keeps the zoom.
export function useMindMapArrival({ layout, wrapperRef, transformRef }: UseMindMapArrivalArgs): void {
  const arrival = useLessonSessionStore((state) => state.arrivalVerse);
  const setArrival = useLessonSessionStore((state) => state.setArrivalVerse);

  useLayoutEffect(() => {
    const wrapper = wrapperRef.current;
    const transform = transformRef.current;
    if (!arrival || !wrapper || !transform) return;
    const hall = layout.nodes
      .filter(isPericopeNode)
      .find((node) => node.data.book === arrival.book && node.data.chapter === arrival.chapter && (node.data.rangeStartVerse ?? 0) <= arrival.verseNumber && arrival.verseNumber <= (node.data.rangeEndVerse ?? 0));
    const chip = hall && layout.verseChips.find((candidate) => candidate.pericopeId === hall.data.id && candidate.verseNumber === arrival.verseNumber);
    if (!chip) return;
    const rect = wrapper.getBoundingClientRect();
    if (rect.width === 0) return;
    const scale = transform.state.scale;
    transform.setTransform(rect.width / 2 - chip.x * scale, rect.height * TARGET_HEIGHT_FRACTION - chip.y * scale, scale, 0);
    setArrival(null);
  }, [arrival, layout, wrapperRef, transformRef, setArrival]);
}
