"use client";

import { useState, type ReactNode } from "react";
import { Eye } from "lucide-react";
import { firstLettersDisplay } from "@/lib/verseFirstLetters";

interface VerseViewButtonsProps {
  text: string;
  verseMarkers?: Record<number, number>;
  // Rendered in the SAME row as the two buttons below, to their right — SRS review's own
  // Auto-complete (testing) button (see SrsEntityRecall.tsx), which sits here instead of down
  // among the stage's own controls.
  extra?: ReactNode;
}

// A neutral, always-available "look up the verse" pair — "View First Letters" opens a read-only
// overlay showing just the first letters (punctuation and verse-number markers kept in place,
// same display lib/verseFirstLetters.ts's firstLettersDisplay already builds for the Speak/Draw
// hints), "View Verse" shows the real text. A reference lookup with no side effects at all,
// meant to sit on every stage (see LessonControlBar.tsx's own `verseText` prop).
export function VerseViewButtons({ text, verseMarkers, extra }: VerseViewButtonsProps) {
  const [open, setOpen] = useState<"none" | "letters" | "full">("none");

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen("letters")}
          className="flex items-center gap-1 rounded-full border border-line px-2.5 py-1 text-xs font-medium text-ink-muted hover:bg-mist dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          <Eye size={12} /> View First Letters
        </button>
        <button
          type="button"
          onClick={() => setOpen("full")}
          className="flex items-center gap-1 rounded-full border border-line px-2.5 py-1 text-xs font-medium text-ink-muted hover:bg-mist dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          <Eye size={12} /> View Verse
        </button>
        {extra}
      </div>
      {open !== "none" && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center" onClick={() => setOpen("none")}>
          <div onClick={(event) => event.stopPropagation()} className="flex w-full max-w-md flex-col gap-4 rounded-2xl bg-white p-6 dark:bg-zinc-900">
            <p className="text-lg leading-relaxed">{open === "full" ? text : firstLettersDisplay(text, verseMarkers)}</p>
            <button type="button" onClick={() => setOpen("none")} className="self-end rounded-full bg-brand-500 px-5 py-2 text-sm font-semibold text-white">
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
