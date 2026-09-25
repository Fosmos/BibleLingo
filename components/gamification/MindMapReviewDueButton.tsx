"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { RotateCcw } from "lucide-react";
import type { MemorizedEntity } from "@/types";
import { useProgressStore } from "@/store/useProgressStore";
import { dueEntitiesInOrder } from "@/lib/srsReviewQueue";
import { MOTION_DURATION, MOTION_EASE, TAP_SCALE } from "@/lib/motionTokens";

interface MindMapReviewDueButtonProps {
  // Starts a review run over these ranges, in order (see InPlaceSrsReview.tsx).
  onStart: (entityIds: string[]) => void;
}

function rangeLabel(entity: MemorizedEntity): string {
  const verses = entity.startVerse === entity.endVerse ? `${entity.startVerse}` : `${entity.startVerse}–${entity.endVerse}`;
  return `${entity.book} ${entity.chapter}:${verses}`;
}

// A small corner chip on the Mind Map, shown only while something in SRS is due — a quiet
// reminder with its count, not a call to action over the map. Tapping it lists what's due; the
// reader picks where to start, and the review opens there in the sheet (the camera pans to it),
// then carries on through the rest in Bible order.
export function MindMapReviewDueButton({ onStart }: MindMapReviewDueButtonProps) {
  const entities = useProgressStore((state) => state.memorizedEntities);
  const due = useMemo(() => dueEntitiesInOrder(entities), [entities]);
  const [open, setOpen] = useState(false);
  if (due.length === 0) return null;

  function start(first: MemorizedEntity) {
    setOpen(false);
    onStart([first.id, ...due.filter((entity) => entity.id !== first.id).map((entity) => entity.id)]);
  }

  return (
    <div className="absolute bottom-3 left-3 z-20 flex flex-col items-start gap-2">
      <AnimatePresence>
        {open && (
          <motion.ul
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: MOTION_DURATION.fast, ease: MOTION_EASE.enter }}
            className="order-first max-h-60 w-56 overflow-y-auto rounded-xl border border-line bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
          >
            <li className="px-3 pb-1 pt-2 text-caption font-semibold uppercase tracking-wide text-ink-muted">Due for review · start with</li>
            {due.map((entity) => (
              <li key={entity.id}>
                <button
                  type="button"
                  onClick={() => start(entity)}
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-ink hover:bg-mist dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  {rangeLabel(entity)}
                  {entity.srs.lastAccuracy !== undefined && <span className="text-xs text-ink-muted">{Math.round(entity.srs.lastAccuracy)}%</span>}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
      <motion.button
        type="button"
        whileTap={TAP_SCALE}
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-label={`${due.length} due for review`}
        className="relative flex h-8 w-8 items-center justify-center rounded-full bg-white text-ink-muted shadow-sm dark:bg-zinc-900 dark:text-zinc-300"
      >
        <RotateCcw size={15} />
        <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-yellow-400 px-1 text-[10px] font-bold text-ink">
          {due.length}
        </span>
      </motion.button>
    </div>
  );
}
