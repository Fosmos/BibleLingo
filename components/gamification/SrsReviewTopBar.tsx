"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronLeft, RotateCcw } from "lucide-react";
import type { MemorizedEntity } from "@/types";
import { formatVerseSpanLabel } from "@/lib/chapterContent";
import { MOTION_DURATION } from "@/lib/motionTokens";

interface SrsReviewTopBarProps {
  label: string;
  version: string;
  dueEntities: MemorizedEntity[];
  currentEntityId: string;
  onSelect: (entityId: string) => void;
  onRestart: () => void;
}

// Deliberately the SAME chrome shape/size as LessonTopBar.tsx (and so DayPathDiagram.tsx's own
// top bar + progress bar): the `mx-auto max-w-2xl px-4 pt-3` wrapper, one `pb-1` flex row
// (Back, centered "BOOK CH • VERSION", a right-aligned control cluster), then the edge-to-edge
// `h-1.5` progress bar — so an SRS review's parchment sits at the pixel-identical on-screen
// height as the reading view's, not lower. The right cluster carries what used to be a second
// header row and a picker row (Restart, and — only when more than one entity is due — a compact
// jump-to selector) inside this one row so the row's height, and thus everything below it,
// never changes with due count.
export function SrsReviewTopBar({ label, version, dueEntities, currentEntityId, onSelect, onRestart }: SrsReviewTopBarProps) {
  const currentIndex = Math.max(0, dueEntities.findIndex((entity) => entity.id === currentEntityId));
  const progressFraction = dueEntities.length > 0 ? (currentIndex + 1) / dueEntities.length : 0;

  return (
    // pt-4 (not pt-3) + the pb-1 row + h-1.5 bar reproduces DayPathDiagram.tsx's own top-bar
    // block height exactly, so the parchment below lands at the same Y as the reading view's.
    <div className="mx-auto w-full max-w-2xl px-4 pt-4">
      <div className="flex items-center justify-between gap-2 pb-1">
        <Link
          href="/memorized"
          className="flex shrink-0 items-center gap-1 text-sm font-medium text-ink-muted hover:text-brand-600"
        >
          <ChevronLeft size={16} /> Back
        </Link>
        <p className="flex-1 truncate text-center text-sm font-semibold uppercase tracking-wide text-ink-soft dark:text-zinc-300">
          {label} <span className="text-ink-muted">• {version}</span>
        </p>
        <span className="flex shrink-0 items-center gap-2 text-xs font-medium text-ink-muted">
          {dueEntities.length > 1 ? (
            <select
              value={currentEntityId}
              onChange={(event) => onSelect(event.target.value)}
              aria-label="Jump to a due verse group"
              className="max-w-[7rem] truncate rounded-md border border-line bg-transparent py-0.5 pl-1 pr-4 text-xs text-ink-muted dark:border-zinc-700"
            >
              {dueEntities.map((entity) => (
                <option key={entity.id} value={entity.id}>
                  {formatVerseSpanLabel(entity.book, entity.chapter, entity.startVerse, entity.endVerse)}
                </option>
              ))}
            </select>
          ) : (
            <span>{dueEntities.length} due</span>
          )}
          <button type="button" onClick={onRestart} aria-label="Restart this review" className="hover:text-brand-600">
            <RotateCcw size={14} />
          </button>
        </span>
      </div>
      <div
        className="h-1.5 w-full rounded-full bg-mist dark:bg-zinc-800"
        role="progressbar"
        aria-valuenow={Math.round(progressFraction * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <motion.div
          className="h-full rounded-full bg-brand-500"
          initial={{ width: 0 }}
          animate={{ width: `${progressFraction * 100}%` }}
          transition={{ duration: MOTION_DURATION.base }}
        />
      </div>
    </div>
  );
}
