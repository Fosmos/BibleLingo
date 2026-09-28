"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Archive, X } from "lucide-react";
import { useProgressStore } from "@/store/useProgressStore";
import { TAP_SCALE } from "@/lib/motionTokens";
import { BodyPortal } from "@/components/ui/BodyPortal";
import { LeitnerBoxes } from "@/components/gamification/LeitnerBoxes";

// A small corner button on the Mind Map that opens the reader's Leitner boxes (see
// LeitnerBoxes.tsx) in a floating panel over the map — every memorized range in its box, each
// movable up or down. Hidden until something is in SRS at all.
export function MindMapLeitnerButton() {
  const hasEntities = useProgressStore((state) => state.memorizedEntities.length > 0);
  const [open, setOpen] = useState(false);
  if (!hasEntities) return null;

  return (
    <>
      <motion.button
        type="button"
        whileTap={TAP_SCALE}
        onClick={() => setOpen(true)}
        aria-label="Leitner boxes"
        title="Leitner boxes"
        className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-ink-muted shadow-sm dark:bg-zinc-900 dark:text-zinc-300"
      >
        <Archive size={15} />
      </motion.button>
      {open && (
        <BodyPortal>
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-2 sm:items-center sm:p-4" onClick={() => setOpen(false)}>
            <div
              onClick={(event) => event.stopPropagation()}
              className="flex max-h-[85dvh] w-full max-w-md flex-col gap-3 overflow-y-auto rounded-2xl bg-brand-50 p-4 shadow-xl dark:bg-zinc-900"
            >
              <div className="flex items-center justify-between">
                <p className="text-caption font-semibold uppercase tracking-wide text-brand-500">Leitner boxes</p>
                <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="flex h-8 w-8 items-center justify-center rounded-full text-ink-muted hover:bg-mist dark:hover:bg-zinc-800">
                  <X size={16} />
                </button>
              </div>
              <p className="text-xs text-ink-muted">Move a range up to review it more often, or down to review it less.</p>
              <LeitnerBoxes />
            </div>
          </div>
        </BodyPortal>
      )}
    </>
  );
}
