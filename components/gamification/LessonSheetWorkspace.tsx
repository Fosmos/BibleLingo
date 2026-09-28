"use client";

import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { useLessonSessionStore } from "@/store/useLessonSessionStore";
import { useExpandedVerseZone } from "@/lib/useExpandedVerseZone";

interface LessonSheetWorkspaceProps {
  children: ReactNode;
}

// Inside the Mind Map lesson sheet, a stage whose real work is a whole WORKSPACE (Understand's
// clause cards + role palette, Visualize's scene form) can't live in the sheet's fixed-height
// drill zone — it shrank there to an unreadable fraction of its size. This hands it the
// verse zone instead (the slot LessonPageCard.tsx's own card normally portals into — the caller
// renders no page card while this is in use), grown to everything above the stage's Continue
// button (see lib/useExpandedVerseZone.ts), as its own scrollable panel. Renders nothing off
// the sheet — callers check useInLessonSheet() and lay out their normal inline shape there.
export function LessonSheetWorkspace({ children }: LessonSheetWorkspaceProps) {
  const slot = useLessonSessionStore((state) => state.senseCardPortalNode);
  useExpandedVerseZone(slot !== null);
  if (!slot) return null;
  return createPortal(
    <div className="flex h-full flex-col gap-3 overflow-y-auto px-4 pb-4 pt-3">{children}</div>,
    slot,
  );
}

export function useInLessonSheet(): boolean {
  return useLessonSessionStore((state) => state.senseCardPortalNode !== null);
}
