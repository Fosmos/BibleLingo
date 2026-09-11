"use client";

import { motion } from "framer-motion";
import type { VerseSegment } from "@/types";
import { formatVerseRangeLabel } from "@/lib/chapterContent";
import { TAP_SCALE } from "@/lib/motionTokens";

interface PericopeCardActionProps {
  isSpilloverOnly: boolean;
  isTodaysLesson: boolean;
  todaysVerses: VerseSegment[];
  actionLabel: string;
  onClick: () => void;
}

// Split out of PericopeCard.tsx purely to keep that file under this codebase's 200-line cap.
// Only ever rendered on the one emphasized card (see PericopeCard.tsx's isEmphasized) — a
// locked or completed card never reaches here at all, it renders as a PericopeCompactRow
// instead. So this only ever needs two shapes: the active lesson's own "Today's Verse(s)"
// text + "Learn" button, or a plain single-line button for whatever OTHER active day this is
// (a capstone day — Full Review, Boss Battle, ...). Renders nothing for a spillover-only
// card — its own independent action would be redundant right above the section that actually
// owns the lesson's one "Learn" button (see PericopeCard.tsx).
export function PericopeCardAction({ isSpilloverOnly, isTodaysLesson, todaysVerses, actionLabel, onClick }: PericopeCardActionProps) {
  if (isSpilloverOnly) return null;

  if (isTodaysLesson) {
    return (
      <div className="mt-3 flex flex-col gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
            {todaysVerses.length === 1 ? "Today's Verse" : "Today's Verses"} — {formatVerseRangeLabel(todaysVerses)}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-ink dark:text-zinc-100">{todaysVerses.map((verse) => verse.text).join(" ")}</p>
        </div>
        <motion.button
          type="button"
          whileTap={TAP_SCALE}
          onClick={onClick}
          className="w-full rounded-full bg-brand-500 py-2 text-sm font-semibold text-white"
        >
          Learn
        </motion.button>
      </div>
    );
  }

  return (
    <motion.button
      type="button"
      whileTap={TAP_SCALE}
      onClick={onClick}
      className="mt-3 w-full rounded-full bg-brand-500 py-2 text-sm font-semibold text-white"
    >
      {actionLabel}
    </motion.button>
  );
}
