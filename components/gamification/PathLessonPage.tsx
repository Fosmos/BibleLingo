"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useMindMapDrillSlot } from "@/lib/useMindMapDrillSlot";
import { useMindMapSenseCardSlot } from "@/lib/useMindMapSenseCardSlot";
import { useLessonSessionStore } from "@/store/useLessonSessionStore";
import { LessonSheetHeader } from "@/components/gamification/LessonSheetHeader";
import { DrillHelpChips } from "@/components/gamification/DrillHelpChips";

interface PathLessonPageProps {
  onClose: () => void;
  // The lesson tree itself — mounted here, hidden, while its verse and controls portal into the page.
  children: ReactNode;
}

// How long the drill zone may sit empty before the fallback view appears (see LessonCardBody.tsx).
const FALLBACK_DELAY_MS = 200;

// A lesson on the chapter path, as one page in place of the reader (design_handoff_lesson_view):
// under the top bar (MindMapSheetBreadcrumb.tsx) the header, then two zones and no scrolling —
// the verse fills the top (SheetVerseZone.tsx fits it, with its reference and ghost lines, via
// LessonPageCard.tsx), and the drill tray sits at the bottom at its natural height: the stage's
// Letters / Verse / Skip chips (DrillHelpChips.tsx), then whatever the stage
// needs (SheetDrillPortal.tsx). The lesson tree mounts in an invisible layer; a screen with no
// drill controls of its own shows that layer instead.
export function PathLessonPage({ onClose, children }: PathLessonPageProps) {
  const verseSlotRef = useMindMapSenseCardSlot();
  const drillSlotRef = useMindMapDrillSlot();
  const drillPortalUsers = useLessonSessionStore((state) => state.drillPortalUsers);
  const setLessonPageOpen = useLessonSessionStore((state) => state.setLessonPageOpen);
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    setLessonPageOpen(true);
    return () => setLessonPageOpen(false);
  }, [setLessonPageOpen]);

  useEffect(() => {
    const timeout = setTimeout(() => setShowFallback(drillPortalUsers === 0), drillPortalUsers > 0 ? 0 : FALLBACK_DELAY_MS);
    return () => clearTimeout(timeout);
  }, [drillPortalUsers]);

  return (
    <>
      <div className="fixed inset-0 z-30 bg-parchment dark:bg-zinc-900">
        <div className="mx-auto flex h-full max-w-2xl flex-col pb-[env(safe-area-inset-bottom)] pt-[calc(3.5rem+env(safe-area-inset-top))]">
          <LessonSheetHeader onClose={onClose} />
          <div ref={verseSlotRef} className="flex min-h-0 flex-1 flex-col overflow-hidden" />
          <div className="flex shrink-0 flex-col gap-3.5 pb-6 pt-4">
            <DrillHelpChips />
            {/* `lesson-sheet-controls` is a styling hook — OnScreenKeyboard.tsx and friends switch to their in-card layouts under it. */}
            <div ref={drillSlotRef} className="lesson-sheet-controls lesson-page-tray flex w-full flex-col px-4" />
          </div>
        </div>
      </div>
      <div
        className={
          showFallback
            ? "fixed inset-x-0 bottom-0 top-[calc(3.5rem+env(safe-area-inset-top))] z-30 overflow-y-auto bg-parchment px-4 py-6 dark:bg-zinc-900"
            : "pointer-events-none invisible fixed inset-x-0 top-0 h-0 overflow-hidden"
        }
        aria-hidden={showFallback ? undefined : true}
      >
        {children}
      </div>
    </>
  );
}
