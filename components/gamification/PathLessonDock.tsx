"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useMindMapDrillSlot } from "@/lib/useMindMapDrillSlot";
import { useLessonSessionStore } from "@/store/useLessonSessionStore";
import { LessonSheetHeader } from "@/components/gamification/LessonSheetHeader";

interface PathLessonDockProps {
  onClose: () => void;
  // The lesson tree itself — mounted here, hidden, while its controls portal into the drill zone.
  children: ReactNode;
}

// How long the drill zone may sit empty before the fallback view appears (see LessonCardBody.tsx).
const FALLBACK_DELAY_MS = 200;

// A lesson's controls on the chapter path: docked at the bottom of the screen — the stage header,
// then a fixed 30dvh drill zone (the keyboard and every other drill's controls portal in via
// SheetDrillPortal.tsx) — while the verse itself sits in its own card up on the path
// (PathLessonVerseSlot.tsx). The lesson tree mounts here in an invisible layer, the same as the
// Mind Map's sheet; a screen with no drill controls of its own shows that layer full screen instead.
export function PathLessonDock({ onClose, children }: PathLessonDockProps) {
  const drillSlotRef = useMindMapDrillSlot();
  const drillPortalUsers = useLessonSessionStore((state) => state.drillPortalUsers);
  const expandVerseZone = useLessonSessionStore((state) => state.expandedVerseZoneUsers > 0);
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setShowFallback(drillPortalUsers === 0), drillPortalUsers > 0 ? 0 : FALLBACK_DELAY_MS);
    return () => clearTimeout(timeout);
  }, [drillPortalUsers]);

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-30 mx-auto flex max-w-2xl flex-col overflow-hidden rounded-t-organic bg-parchment pb-[env(safe-area-inset-bottom)] shadow-organic-lg dark:bg-zinc-900">
        <LessonSheetHeader onClose={onClose} />
        {/* `lesson-sheet-controls` is a styling hook — OnScreenKeyboard.tsx and friends switch to their in-card layouts under it. */}
        <div ref={drillSlotRef} className={`lesson-sheet-controls w-full overflow-hidden ${expandVerseZone ? "" : "h-[30dvh]"}`} />
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
