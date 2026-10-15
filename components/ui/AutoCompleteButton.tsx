"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { FlaskConical } from "lucide-react";
import { useLessonSessionStore } from "@/store/useLessonSessionStore";

interface AutoCompleteButtonProps {
  onClick: () => void;
  // Overrides the default "Auto-complete (testing)" text — e.g. DaySessionController.tsx's
  // "Auto-complete lesson (testing)", which skips the WHOLE day at once rather than just the
  // one drill stage every other caller of this button skips.
  label?: string;
}

export function AutoCompleteButton({ onClick, label }: AutoCompleteButtonProps) {
  // Inside the Mind Map lesson sheet, this testing shortcut isn't part of the drill — it moves up
  // beside the breadcrumb's own lookup buttons (see lib/useMindMapVerseViewSlot.ts), icon-only,
  // instead of taking a row of the sheet's fixed-height controls box.
  const breadcrumbSlot = useLessonSessionStore((state) => state.verseViewPortalNode);
  // On the lesson page a stage's shortcut is the tray's Skip chip (DrillHelpChips.tsx) — and the
  // whole-lesson one isn't offered there at all.
  const lessonPage = useLessonSessionStore((state) => state.lessonPageOpen);
  const setSkipStage = useLessonSessionStore((state) => state.setSkipStage);
  const latest = useRef(onClick);
  useEffect(() => {
    latest.current = onClick;
  });
  const skips = lessonPage && label === undefined;
  useEffect(() => {
    if (!skips) return;
    setSkipStage(() => latest.current());
    return () => setSkipStage(null);
  }, [skips, setSkipStage]);
  const text = label ?? "Auto-complete (testing)";

  if (lessonPage) return null;

  if (breadcrumbSlot) {
    return createPortal(
      <button
        type="button"
        onClick={onClick}
        aria-label={text}
        title={text}
        className="flex h-8 w-8 items-center justify-center rounded-full border border-dashed border-line text-ink-muted hover:bg-mist dark:border-zinc-600 dark:text-zinc-400 dark:hover:bg-zinc-800"
      >
        <FlaskConical size={14} />
      </button>,
      breadcrumbSlot,
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1.5 self-start rounded-full border border-dashed border-line px-3 py-1 text-xs font-medium text-ink-muted hover:bg-mist dark:border-zinc-600 dark:text-zinc-400 dark:hover:bg-zinc-800"
    >
      <FlaskConical size={14} />
      {text}
    </button>
  );
}
