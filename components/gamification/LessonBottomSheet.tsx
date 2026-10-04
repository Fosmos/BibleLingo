"use client";

import { motion } from "framer-motion";
import { useEffect, useState, type ReactNode } from "react";
import { MOTION_DURATION, MOTION_EASE } from "@/lib/motionTokens";
import { useMindMapSenseCardSlot } from "@/lib/useMindMapSenseCardSlot";
import { useMindMapDrillSlot } from "@/lib/useMindMapDrillSlot";
import { useLessonSessionStore } from "@/store/useLessonSessionStore";
import { LessonSheetHeader } from "@/components/gamification/LessonSheetHeader";

interface LessonBottomSheetProps {
  open: boolean;
  // Content that doesn't use the verse/drill zones at all (the path setup screens — see
  // MindMapPathSetup.tsx): shown straight away as one scrolling page over the whole sheet.
  plain?: boolean;
  // The header's close button (LessonSheetHeader.tsx).
  onClose: () => void;
  children: ReactNode;
}

// How long the drill zone may sit empty before the fallback view appears — long enough to ride
// out one stage's controls unmounting a frame before the next stage's mount, so a normal stage
// change never flashes the hidden lesson tree.
const FALLBACK_DELAY_MS = 200;

// The Mind Map's tap-a-verse tab, sliding up over the bottom 70dvh of the screen (the canvas
// runs full-screen behind it, the verse framed in the 30dvh left above — see lib/useMindMapVerseFocusLock.ts). ONE parchment
// surface: a verse zone (LessonPageCard.tsx, or the verse preview, portals the sense lines into
// it — see lib/useMindMapSenseCardSlot.ts) over a drill zone (each stage's controls, or the
// preview's action button, portal in via SheetDrillPortal.tsx). The sheet is 70dvh; the drill
// zone (the keyboard and other controls) is a fixed 30dvh docked at the bottom, never giving up
// room, and the verse zone takes everything between it and the header — a verse too long for
// that scrolls rather than squeezing the keyboard.
//
// `children` — the verse preview or the whole lesson tree — still mounts, but in a layer that's
// invisible for as long as anything fills the drill zone: that's how stage names, info tips and
// every other bit of lesson chrome drop out here without each stage needing to know. It stays
// laid out (not display:none) so the lesson's hidden measurement probes still see real sizes.
// A screen with no drill controls of its own (a "missed a word — redo?" choice, say) shows that
// layer instead, over both zones.
//
// Always mounted, only `animate.y` flips — a conditionally-mounted sheet re-ran its slide-in on
// every parent re-render mid-lesson and could get stuck off-screen (see git history).
export function LessonBottomSheet({ open, plain, onClose, children }: LessonBottomSheetProps) {
  const senseCardSlotRef = useMindMapSenseCardSlot();
  const drillSlotRef = useMindMapDrillSlot();
  const drillPortalUsers = useLessonSessionStore((state) => state.drillPortalUsers);
  // A screen whose drill zone is just one button (see lib/useExpandedVerseZone.ts) — the verse
  // zone takes everything above it, the drill zone only that button's own height.
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
    <motion.div
      // Renders its starting position straight into the first paint — without this the closed
      // sheet sat fully on screen (a blank parchment panel) until Framer's animation loop first
      // ran, which the Mind Map's own heavy first load could hold off for several seconds.
      initial={false}
      animate={{ y: open ? 0 : "115%" }}
      transition={{ duration: MOTION_DURATION.base, ease: MOTION_EASE.enter }}
      // A floating card, not an edge-to-edge sheet — inset from the sides and bottom with every
      // corner rounded, the same as the Mind Map's path tab (MindMapPathTab.tsx), so the map stays
      // in view all around it. Its height leaves the top 30dvh of the map clear.
      className={`fixed inset-x-2 bottom-[calc(0.5rem+env(safe-area-inset-bottom))] z-30 mx-auto flex h-[calc(70dvh-0.5rem-env(safe-area-inset-bottom))] max-w-2xl flex-col overflow-hidden rounded-organic bg-parchment shadow-organic-lg dark:bg-zinc-900 ${open ? "" : "pointer-events-none"}`}
    >
      {/* Both zones carry no padding of their own — each portaled child brings its own, and the
          verse zone's real clientWidth/clientHeight is measured as the text's available box. */}
      {!plain && <LessonSheetHeader onClose={onClose} />}
      {/* The zones below the header — the verse zone measures this wrapper as its available box. */}
      <div className="flex min-h-0 w-full flex-1 flex-col">
      <div ref={senseCardSlotRef} className="min-h-0 w-full flex-1 overflow-y-auto" />
      {/* A fixed 30dvh, docked to the bottom — never grows or shrinks, whatever the verse above
          needs (the verse zone scrolls instead), so the keyboard is always the same size.
          `lesson-sheet-controls` is a styling hook — OnScreenKeyboard.tsx, FillInTheBlankRep.tsx
          and friends switch to their fill-the-zone layouts under it. */}
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
    </motion.div>
  );
}
