"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useMindMapSenseCardSlot } from "@/lib/useMindMapSenseCardSlot";
import { useMindMapDrillSlot } from "@/lib/useMindMapDrillSlot";
import { useLessonSessionStore } from "@/store/useLessonSessionStore";
import { LessonSheetHeader } from "@/components/gamification/LessonSheetHeader";

interface LessonCardBodyProps {
  open: boolean;
  // Content that doesn't use the verse/drill zones (the path setup screens): one scrolling page.
  plain?: boolean;
  onClose: () => void;
  children: ReactNode;
}

// How long the drill zone may sit empty before the fallback view appears — long enough to ride
// out one stage's controls unmounting a frame before the next stage's mount.
const FALLBACK_DELAY_MS = 200;

// The inside of the lesson card, wherever it sits — the Mind Map's bottom sheet
// (LessonBottomSheet.tsx); the chapter path lays it out as a page of its own (PathLessonPage.tsx). The
// parent must be a positioned flex column of fixed height. ONE parchment surface: the header, a
// verse zone (LessonPageCard.tsx or the verse preview portal their sense lines into it — see
// lib/useMindMapSenseCardSlot.ts) taking all the room between the header and a fixed 30dvh drill
// zone (each stage's controls portal in via SheetDrillPortal.tsx), so the keyboard is always the
// same size and a long verse scrolls instead.
//
// `children` — the whole lesson tree — still mounts, in a layer that's invisible while anything
// fills the drill zone (that's how stage names and other lesson chrome drop out), laid out rather
// than display:none so the lesson's measurement probes still see real sizes. A screen with no
// drill controls of its own shows that layer instead, over both zones.
export function LessonCardBody({ open, plain, onClose, children }: LessonCardBodyProps) {
  const senseCardSlotRef = useMindMapSenseCardSlot();
  const drillSlotRef = useMindMapDrillSlot();
  const drillPortalUsers = useLessonSessionStore((state) => state.drillPortalUsers);
  // A screen whose drill zone is just one button (lib/useExpandedVerseZone.ts) — that button's own height.
  const expandVerseZone = useLessonSessionStore((state) => state.expandedVerseZoneUsers > 0);
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    if (drillPortalUsers > 0 || !open) {
      const timeout = setTimeout(() => setShowFallback(false), 0);
      return () => clearTimeout(timeout);
    }
    const timeout = setTimeout(() => setShowFallback(true), FALLBACK_DELAY_MS);
    return () => clearTimeout(timeout);
  }, [drillPortalUsers, open]);

  return (
    <>
      {!plain && <LessonSheetHeader onClose={onClose} />}
      <div className="flex min-h-0 w-full flex-1 flex-col">
        <div ref={senseCardSlotRef} className="min-h-0 w-full flex-1 overflow-y-auto" />
        {/* `lesson-sheet-controls` is a styling hook — OnScreenKeyboard.tsx, FillInTheBlankRep.tsx
            and friends switch to their in-card layouts under it. */}
        <div ref={drillSlotRef} className={`lesson-sheet-controls w-full overflow-hidden ${expandVerseZone ? "shrink-0" : "h-[30dvh] shrink-0"}`} />
      </div>
      <div
        className={
          showFallback || plain
            ? "absolute inset-0 overflow-y-auto bg-parchment px-4 py-6 dark:bg-zinc-900"
            : "pointer-events-none invisible absolute inset-x-0 top-0 h-0 overflow-hidden"
        }
        aria-hidden={showFallback || plain ? undefined : true}
      >
        {open && children}
      </div>
    </>
  );
}
