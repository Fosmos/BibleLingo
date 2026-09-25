"use client";

import { useState, type ReactNode } from "react";
import { BookOpen, CaseSensitive, Eye } from "lucide-react";
import { firstLettersByClause } from "@/lib/verseFirstLetters";
import { BodyPortal } from "@/components/ui/BodyPortal";
import { FIRST_LETTER_TEXT_SPACING_CLASS } from "@/lib/firstLetterGap";

interface VerseViewButtonsProps {
  text: string;
  // Rendered in the SAME row as the two buttons below, to their right — SRS review's own
  // Auto-complete (testing) button (see SrsEntityRecall.tsx), which sits here instead of down
  // among the stage's own controls.
  extra?: ReactNode;
  // Icon-only round buttons — for the Mind Map sheet's breadcrumb row (see LessonControlBar.tsx's
  // portal), where two full-text pills left the chapter/pericope trail no room on a phone.
  compact?: boolean;
}

const PILL_CLASS =
  "flex items-center gap-1 rounded-full border border-line px-2.5 py-1 text-xs font-medium text-ink-muted hover:bg-mist dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800";
const ICON_CLASS =
  "flex h-8 w-8 items-center justify-center rounded-full border border-line text-ink-muted hover:bg-mist dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800";

// A neutral, always-available "look up the verse" pair — "View First Letters" opens a read-only
// overlay showing just the first letters, one real clause per line (lib/verseFirstLetters.ts's
// own firstLettersByClause), "View Verse" shows the real text. A reference lookup with no side
// effects at all, meant to sit on every stage (see LessonControlBar.tsx's own `verseText` prop).
// The overlay renders into <body> (see BodyPortal.tsx) — its buttons can live inside the Mind
// Map breadcrumb, whose backdrop-blur would otherwise pin a `fixed` overlay to just that bar.
export function VerseViewButtons({ text, extra, compact }: VerseViewButtonsProps) {
  const [open, setOpen] = useState<"none" | "letters" | "full">("none");

  return (
    <>
      <div className="flex items-center gap-2">
        {compact ? (
          <>
            <button type="button" onClick={() => setOpen("letters")} aria-label="View First Letters" title="View First Letters" className={ICON_CLASS}>
              <CaseSensitive size={16} />
            </button>
            <button type="button" onClick={() => setOpen("full")} aria-label="View Verse" title="View Verse" className={ICON_CLASS}>
              <BookOpen size={15} />
            </button>
          </>
        ) : (
          <>
            <button type="button" onClick={() => setOpen("letters")} className={PILL_CLASS}>
              <Eye size={12} /> View First Letters
            </button>
            <button type="button" onClick={() => setOpen("full")} className={PILL_CLASS}>
              <Eye size={12} /> View Verse
            </button>
          </>
        )}
        {extra}
      </div>
      {open !== "none" && (
        <BodyPortal>
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center" onClick={() => setOpen("none")}>
            <div onClick={(event) => event.stopPropagation()} className="flex w-full max-w-md flex-col gap-4 rounded-2xl bg-white p-6 dark:bg-zinc-900">
              {open === "full" ? (
                <p className="text-lg leading-relaxed">{text}</p>
              ) : (
                <div className="flex max-h-[60vh] flex-col gap-1 overflow-y-auto overflow-x-hidden">
                  {firstLettersByClause(text).map((line, index) => (
                    <p key={index} className={`whitespace-nowrap text-lg leading-relaxed ${FIRST_LETTER_TEXT_SPACING_CLASS}`}>
                      {line}
                    </p>
                  ))}
                </div>
              )}
              <button type="button" onClick={() => setOpen("none")} className="self-end rounded-full bg-brand-500 px-5 py-2 text-sm font-semibold text-white">
                Close
              </button>
            </div>
          </div>
        </BodyPortal>
      )}
    </>
  );
}
