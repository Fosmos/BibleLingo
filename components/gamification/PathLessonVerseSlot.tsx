"use client";

import { useEffect, useRef } from "react";
import { useLessonSessionStore } from "@/store/useLessonSessionStore";

interface PathLessonVerseSlotProps {
  // The verse's existing raised-card classes (ChapterPathVerseRow.tsx) — the slot IS that card.
  className: string;
}

// The room a verse has on screen while a lesson runs on the chapter path: everything between the
// lesson top bar and the controls docked at the bottom (PathLessonDock.tsx — its header plus the
// 30dvh drill zone). What the lesson lays its verse out to fit.
const availableVerseHeightPx = () => Math.max(160, window.innerHeight * 0.7 - 190);

// A running lesson's verse zone on the chapter path: the tapped verse's own raised card, which the
// lesson's sense lines portal into (the same store slot the Mind Map sheet's verse zone fills —
// see lib/useMindMapSenseCardSlot.ts), sized by its content like the card always is.
export function PathLessonVerseSlot({ className }: PathLessonVerseSlotProps) {
  const slotRef = useRef<HTMLDivElement>(null);
  const setPortalNode = useLessonSessionStore((state) => state.setSenseCardPortalNode);
  const setFillHeight = useLessonSessionStore((state) => state.setSenseCardFillHeightPx);
  const setColumnWidth = useLessonSessionStore((state) => state.setSenseCardColumnWidthPx);

  useEffect(() => {
    const el = slotRef.current;
    setPortalNode(el);
    if (!el) return;
    const measure = () => {
      setFillHeight(availableVerseHeightPx());
      setColumnWidth(el.clientWidth);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
      setPortalNode(null);
      setFillHeight(null);
      setColumnWidth(null);
    };
  }, [setPortalNode, setFillHeight, setColumnWidth]);

  return <div ref={slotRef} className={`path-lesson-verse ${className}`} />;
}
