"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { MOTION_DURATION, MOTION_EASE } from "@/lib/motionTokens";
import { LessonCardBody } from "@/components/gamification/LessonCardBody";

interface LessonBottomSheetProps {
  open: boolean;
  // Content that doesn't use the verse/drill zones at all (the path setup screens — see
  // MindMapPathSetup.tsx): shown straight away as one scrolling page over the whole sheet.
  plain?: boolean;
  // The header's close button (LessonSheetHeader.tsx).
  onClose: () => void;
  children: ReactNode;
}

// The Mind Map's tap-a-verse card, sliding up over the bottom 70dvh of the screen (the canvas runs
// full-screen behind it, the verse framed in the 30dvh left above — see
// lib/useMindMapVerseFocusLock.ts). Its inside — header, verse zone, fixed drill zone — is
// LessonCardBody.tsx (the chapter path uses PathLessonDock.tsx + PathLessonVerseSlot.tsx instead).
//
// Always mounted, only `animate.y` flips — a conditionally-mounted sheet re-ran its slide-in on
// every parent re-render mid-lesson and could get stuck off-screen (see git history).
export function LessonBottomSheet({ open, plain, onClose, children }: LessonBottomSheetProps) {
  return (
    <motion.div
      // Renders its starting position straight into the first paint — without this the closed
      // sheet sat fully on screen until Framer's animation loop first ran.
      initial={false}
      animate={{ y: open ? 0 : "115%" }}
      transition={{ duration: MOTION_DURATION.base, ease: MOTION_EASE.enter }}
      // A floating card inset from the sides and bottom, every corner rounded, so the map stays in
      // view all around it.
      className={`fixed inset-x-2 bottom-[calc(0.5rem+env(safe-area-inset-bottom))] z-30 mx-auto flex h-[calc(70dvh-0.5rem-env(safe-area-inset-bottom))] max-w-2xl flex-col overflow-hidden rounded-organic bg-parchment shadow-organic-lg dark:bg-zinc-900 ${open ? "" : "pointer-events-none"}`}
    >
      <LessonCardBody open={open} plain={plain} onClose={onClose}>
        {children}
      </LessonCardBody>
    </motion.div>
  );
}
