"use client";

import type { ReactNode } from "react";
import { Lock } from "lucide-react";
import { motion } from "framer-motion";
import { TAP_SCALE } from "@/lib/motionTokens";

interface PericopeCompactRowProps {
  primaryLabel: string;
  secondaryLabel: string;
  isCompleted: boolean;
  // False for a spillover-only zone with no lesson of its own to open (see PericopeCard.tsx's
  // isSpilloverOnly) — renders as plain, non-interactive text instead of a tappable row.
  hasAction: boolean;
  onClick: () => void;
  // Building view only (see BuildingRoomView.tsx) — this section's own pericope-level
  // location/peg tag chips. Shown on every row, not just the emphasized one: unlike the
  // per-verse grid (which only makes sense once a section's verses are actually on screen),
  // a section's own location/peg tag is worth setting or reviewing regardless of lock state.
  headerExtra?: ReactNode;
}

// The collapsed, single-line form every non-current pericope/capstone card takes — see
// PericopeCard.tsx's isEmphasized. Deliberately chrome-free (no border, no shadow, no
// padding-heavy box) so a long path reads as a short, calm list instead of a stack of near-
// identical cards; the rail circle to its left (PericopeCardRail.tsx) already carries the
// locked/completed signal, so this only needs the label and, when there's somewhere to go, a
// small trailing affordance.
export function PericopeCompactRow({ primaryLabel, secondaryLabel, isCompleted, hasAction, onClick, headerExtra }: PericopeCompactRowProps) {
  const label = (
    <span className="min-w-0 flex-1">
      <span className="block truncate text-sm font-semibold text-ink-soft dark:text-zinc-300">{primaryLabel}</span>
      {secondaryLabel && <span className="block truncate text-xs text-ink-muted">{secondaryLabel}</span>}
    </span>
  );

  return (
    <div className="flex w-full flex-col py-3 pl-11 pr-3">
      {hasAction ? (
        <motion.button
          type="button"
          whileTap={TAP_SCALE}
          onClick={onClick}
          className="-mx-3 flex items-center gap-3 rounded-lg px-3 py-1 text-left transition-colors hover:bg-mist/50 dark:hover:bg-zinc-900/60"
        >
          {label}
          {isCompleted ? (
            <span className="shrink-0 text-xs font-medium text-brand-600 dark:text-brand-400">Review</span>
          ) : (
            <Lock size={14} className="shrink-0 text-ink-muted dark:text-zinc-600" />
          )}
        </motion.button>
      ) : (
        <div className="flex items-center gap-3">{label}</div>
      )}
      {headerExtra && <div className="mt-1.5">{headerExtra}</div>}
    </div>
  );
}
