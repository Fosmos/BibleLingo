"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useLessonSessionStore } from "@/store/useLessonSessionStore";
import { useFitScale } from "@/lib/useFitScale";

interface SheetDrillPortalProps {
  node: HTMLDivElement;
  children: ReactNode;
}

// Renders a stage's own controls (or the verse preview's action button) into the Mind Map
// sheet's fixed-height drill zone, filling it: the wrapper is at least as tall as the zone, so a
// `flex-1` control (the keyboard, the drawing pad, the word bank) grows into all of it. Only if
// the controls genuinely need MORE than the zone does the wrapper scale down to fit — that zone
// never scrolls or changes size (see useFitScale). While mounted it also counts as a drill-zone
// user, which is what tells LessonBottomSheet.tsx to keep the rest of the lesson tree hidden.
export function SheetDrillPortal({ node, children }: SheetDrillPortalProps) {
  const addUser = useLessonSessionStore((state) => state.addDrillPortalUser);
  const removeUser = useLessonSessionStore((state) => state.removeDrillPortalUser);
  // Measured live, not read once — the zone's height changes under an already-mounted portal
  // (the preview's content-sized zone becomes the lesson's fill-the-rest one; a longer verse; a rotate).
  const [zoneHeightPx, setZoneHeightPx] = useState<number | null>(null);
  const { contentRef, scale } = useFitScale<HTMLDivElement>(zoneHeightPx);

  useEffect(() => {
    const measure = () => setZoneHeightPx(node.clientHeight);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [node]);

  useEffect(() => {
    addUser();
    return removeUser;
  }, [addUser, removeUser]);

  return createPortal(
    <div
      ref={contentRef}
      className="flex min-h-full flex-col items-center justify-end gap-2 px-3 pb-3 pt-2"
      style={{ transform: `scale(${scale})`, transformOrigin: "top left", width: scale < 1 ? `${100 / scale}%` : "100%" }}
    >
      {children}
    </div>,
    node,
  );
}
