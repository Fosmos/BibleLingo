"use client";

import { createPortal } from "react-dom";
import { FlaskConical, SkipForward } from "lucide-react";
import { useLessonSessionStore } from "@/store/useLessonSessionStore";

interface SkipLessonButtonProps {
  onClick: () => void;
}

const LABEL = "Auto-complete lesson (testing)";

// DaySessionController.tsx's whole-day testing shortcut. Normally fixed off to the side, out of
// document flow, so it can never push a lesson's parchment down the screen (see LessonTopBar.tsx).
// Inside the Mind Map lesson sheet `fixed` would pin it to the SHEET (its slide-in transform
// becomes the containing block), landing on top of the stage's own controls — so there it joins
// the breadcrumb's tool buttons instead (see lib/useMindMapVerseViewSlot.ts), with a skip icon
// so it doesn't read as a second copy of the per-stage AutoCompleteButton's flask.
export function SkipLessonButton({ onClick }: SkipLessonButtonProps) {
  const breadcrumbSlot = useLessonSessionStore((state) => state.verseViewPortalNode);

  if (breadcrumbSlot) {
    return createPortal(
      <button
        type="button"
        onClick={onClick}
        aria-label={LABEL}
        title={LABEL}
        className="order-last flex h-8 w-8 items-center justify-center rounded-full border border-dashed border-line text-ink-muted hover:bg-mist dark:border-zinc-600 dark:text-zinc-400 dark:hover:bg-zinc-800"
      >
        <SkipForward size={14} />
      </button>,
      breadcrumbSlot,
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={LABEL}
      title={LABEL}
      className="fixed right-3 top-3 z-30 flex h-8 w-8 items-center justify-center rounded-full border border-dashed border-line bg-white/90 text-ink-muted shadow-sm hover:bg-mist dark:border-zinc-600 dark:bg-zinc-900/90 dark:text-zinc-400 dark:hover:bg-zinc-800"
    >
      <FlaskConical size={14} />
    </button>
  );
}
