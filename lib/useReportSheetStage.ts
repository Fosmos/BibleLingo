"use client";

import { useEffect } from "react";
import { useLessonSessionStore, type SheetStage } from "@/store/useLessonSessionStore";

// Tells the Mind Map lesson sheet's header (LessonSheetHeader.tsx) which stage is on screen, while
// `active` (inside the sheet) — and clears it again when this screen goes.
export function useReportSheetStage(stage: SheetStage | null, active: boolean | undefined): void {
  const setSheetStage = useLessonSessionStore((state) => state.setSheetStage);
  const { label, reference, step, steps, compact, accuracy, threshold } = stage ?? { label: "", reference: "", step: 0, steps: 0, compact: false };
  useEffect(() => {
    if (!active || !label) return;
    setSheetStage({ label, reference, step, steps, compact, accuracy, threshold });
  }, [active, label, reference, step, steps, compact, accuracy, threshold, setSheetStage]);
  useEffect(() => (active ? () => setSheetStage(null) : undefined), [active, setSheetStage]);
}
