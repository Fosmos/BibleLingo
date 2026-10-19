"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useMindMapDrillSlot } from "@/lib/useMindMapDrillSlot";
import { useLessonSessionStore } from "@/store/useLessonSessionStore";
import { LessonSheetHeader } from "@/components/gamification/LessonSheetHeader";
import { DrillHelpChips } from "@/components/gamification/DrillHelpChips";

interface PathLessonDockProps {
  onClose: () => void;
  // The lesson tree itself — mounted here, hidden, while its controls portal into the drill tray.
  children: ReactNode;
}

// How long the drill zone may sit empty before the fallback view appears (see LessonCardBody.tsx).
const FALLBACK_DELAY_MS = 200;

// A lesson's controls on the chapter path: docked at the bottom of the screen — the stage header,
// the stage's Letters / Verse / Skip chips (DrillHelpChips.tsx), then the drill tray at its natural
// height (the keyboard and every other drill's controls portal in via SheetDrillPortal.tsx) —
// while the verse itself sits in its own row up in the reader (PathLessonVerseSlot.tsx), its
// number beside it. The tray is the lesson page's (`lessonPageOpen`), so the chips, keys and
// reference entry look the same. The lesson tree mounts in an invisible layer; a screen with no
// drill controls of its own shows that layer full screen instead.
export function PathLessonDock({ onClose, children }: PathLessonDockProps) {
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
      <div className="fixed inset-x-0 bottom-0 z-30 mx-auto flex max-w-2xl flex-col rounded-t-organic bg-parchment pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-organic-lg dark:bg-zinc-900">
        <LessonSheetHeader onClose={onClose} />
        <div className="flex flex-col gap-3 pt-1">
          <DrillHelpChips />
          {/* `lesson-sheet-controls` is a styling hook — OnScreenKeyboard.tsx and friends switch to their in-card layouts under it. */}
          <div ref={drillSlotRef} className="lesson-sheet-controls lesson-page-tray flex w-full flex-col px-2.5" />
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
