"use client";

import { useLessonSessionStore } from "@/store/useLessonSessionStore";

// Shared by every useChapterScopedReadingLayout/useChapterReadingLayout caller that can run
// embedded inside the in-place Mind Map lesson sheet (LearnSection.tsx, VerseLessonFlow.tsx,
// DaySessionController.tsx, InPlaceLessonSession.tsx) — resolves the sense-card slot's own real
// measured height/width from the store (lib/useMindMapSenseCardSlot.ts), but only while actually
// embedded; every other caller gets `undefined` for both, so those hooks run their own normal
// DOM measurement exactly as before.
export function useEmbeddedSenseCardOverride(embeddedInMindMap: boolean | undefined): [number | null | undefined, number | null | undefined] {
  const fillHeightPx = useLessonSessionStore((state) => state.senseCardFillHeightPx);
  const columnWidthPx = useLessonSessionStore((state) => state.senseCardColumnWidthPx);
  return embeddedInMindMap ? [fillHeightPx, columnWidthPx] : [undefined, undefined];
}
