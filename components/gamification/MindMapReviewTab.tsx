"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useProgressStore } from "@/store/useProgressStore";
import type { SrsReviewOffer } from "@/lib/srsReviewOffer";
import type { RelearnTarget } from "@/lib/relearnTarget";
import { MOTION_DURATION, MOTION_EASE, TAP_SCALE } from "@/lib/motionTokens";
import { SrsInputModeToggle } from "@/components/gamification/SrsInputModeToggle";

interface MindMapReviewTabProps {
  // The review a tapped verse or chapter offers (lib/srsReviewOffer.ts); null hides the tab.
  offer: SrsReviewOffer | null;
  onReview: (entityIds: string[]) => void;
  // Runs the full Learn flow again over these verses, in the Mind Map sheet (InPlaceRelearnSession.tsx).
  onRelearn: (target: RelearnTarget) => void;
  onClose: () => void;
}

const LINK_CLASS = "text-xs font-medium text-ink-muted hover:underline";

// The small tab that pops up over the bottom of the Mind Map when a verse due for review, or a
// chapter holding memorized verses, is tapped — the same shape as MindMapPathTab.tsx. A chapter
// can be reviewed before anything in it is due ("Review early"). Relearn runs the full Learn flow
// again, right in the map's sheet (InPlaceRelearnSession.tsx), over the whole lesson the verse was learned in, or the chapter's
// memorized verses — with "just vN" for the tapped verse alone.
export function MindMapReviewTab({ offer, onReview, onRelearn, onClose }: MindMapReviewTabProps) {
  const saveRun = useProgressStore((state) => state.saveSrsReviewRun);

  function relearn(startVerse: number, endVerse: number) {
    if (offer) onRelearn({ ...offer.relearn, startVerse, endVerse });
  }

  return (
    <AnimatePresence>
      {offer && (
        <motion.div
          key="review-tab"
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 24, opacity: 0 }}
          transition={{ duration: MOTION_DURATION.base, ease: MOTION_EASE.enter }}
          className="fixed inset-x-3 bottom-[calc(120px+env(safe-area-inset-bottom))] z-30 mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-line bg-parchment px-4 py-3 shadow-[0_-4px_24px_rgba(0,0,0,0.12)] dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="min-w-0 flex-1">
            <p className="text-caption font-semibold uppercase tracking-wide text-ink-muted">
              {offer.scope === "chapter" ? "Chapter" : "Verse"} · {offer.early ? "not due yet" : "due for review"}
            </p>
            <p className="truncate font-serif text-lg font-bold text-ink dark:text-zinc-100">{offer.label}</p>
          </div>
          <SrsInputModeToggle />
          <div className="flex shrink-0 flex-col items-end gap-1">
            <motion.button
              type="button"
              whileTap={TAP_SCALE}
              onClick={() => {
                // A fresh start — never mistaken for a review left part-way (lib/useSrsReviewRun.ts).
                saveRun(null);
                onReview(offer.entityIds);
              }}
              className="rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white"
            >
              {offer.early ? "Review early" : "Review"}
            </motion.button>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => relearn(offer.relearn.startVerse, offer.relearn.endVerse)} className={LINK_CLASS}>
                {offer.relearn.startVerse === offer.relearn.endVerse ? "Relearn" : `Relearn v${offer.relearn.startVerse}–${offer.relearn.endVerse}`}
              </button>
              {offer.relearnVerse !== undefined && (
                <button type="button" onClick={() => relearn(offer.relearnVerse ?? 0, offer.relearnVerse ?? 0)} className={LINK_CLASS}>
                  just v{offer.relearnVerse}
                </button>
              )}
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="shrink-0 rounded-full p-1 text-ink-muted hover:bg-mist dark:hover:bg-zinc-800">
            <X size={18} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
