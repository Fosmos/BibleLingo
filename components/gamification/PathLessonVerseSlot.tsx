"use client";

import { useEffect, useRef, type RefObject } from "react";
import { useLessonSessionStore } from "@/store/useLessonSessionStore";

interface PathLessonVerseSlotProps {
  // The verse's existing raised-card classes (ChapterPathVerseRow.tsx) — the slot IS that card.
  className?: string;
  // Mid-paragraph (sense lines off — ReaderProseRun.tsx): an inline span the stage's words flow
  // into, in the verse's own place in the paragraph.
  inline?: boolean;
}

// The room a verse has on screen while a lesson runs on the chapter path: everything between the
// lesson top bar and the controls docked at the bottom (PathLessonDock.tsx — its header, chips and
// drill tray). What the lesson lays its verse out to fit.
const availableVerseHeightPx = () => Math.max(160, window.innerHeight * 0.7 - 190);

// A running lesson's verse zone on the chapter path: the tapped verse's own raised card, which the
// lesson's sense lines portal into (the same store slot the Mind Map sheet's verse zone fills —
// see lib/useMindMapSenseCardSlot.ts), sized by its content like the card always is.
export function PathLessonVerseSlot({ className, inline = false }: PathLessonVerseSlotProps) {
  const slotRef = useRef<HTMLElement>(null);
  const setVerseInline = useLessonSessionStore((state) => state.setVerseInline);
  const setPortalNode = useLessonSessionStore((state) => state.setSenseCardPortalNode);
  const setFillHeight = useLessonSessionStore((state) => state.setSenseCardFillHeightPx);
  const setColumnWidth = useLessonSessionStore((state) => state.setSenseCardColumnWidthPx);
  const setVerseInRow = useLessonSessionStore((state) => state.setVerseInRow);

  useEffect(() => {
    const el = slotRef.current;
    setPortalNode(el);
    setVerseInRow(true);
    setVerseInline(inline);
    if (!el) return;
    // An inline span has no width of its own — its paragraph's is the column.
    const column = inline ? (el.closest("p") ?? el) : el;
    const measure = () => {
      setFillHeight(availableVerseHeightPx());
      setColumnWidth(column.clientWidth);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(column);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
      setPortalNode(null);
      setVerseInRow(false);
      setVerseInline(false);
      setFillHeight(null);
      setColumnWidth(null);
    };
  }, [setPortalNode, setFillHeight, setColumnWidth, setVerseInRow, setVerseInline, inline]);

  if (inline) return <span ref={slotRef as RefObject<HTMLSpanElement>} className={`path-lesson-verse ${className ?? ""}`} />;
  return <div ref={slotRef as RefObject<HTMLDivElement>} className={`path-lesson-verse ${className ?? ""}`} />;
}
