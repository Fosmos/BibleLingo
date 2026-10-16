"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { RANKS } from "@/lib/ranks";
import { BodyPortal } from "@/components/ui/BodyPortal";
import { Confetti } from "@/components/ui/Confetti";
import { MODAL_BACKDROP, MOTION_DURATION, TAP_SCALE } from "@/lib/motionTokens";
import { RankBadge } from "@/components/gamification/RankBadge";

interface RankUpModalProps {
  // The rank just reached (lib/ranks.ts, by index), or null when closed.
  index: number | null;
  onClose: () => void;
}

// A new rank, celebrated once (RankUpWatcher.tsx): its badge popping in, its title, and the line of
// Scripture that names it.
export function RankUpModal({ index, onClose }: RankUpModalProps) {
  const rank = index === null ? undefined : RANKS[index];
  useEffect(() => {
    if (!rank) return;
    const onKeyDown = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [rank, onClose]);

  return (
    <BodyPortal>
      <AnimatePresence>
        {rank && index !== null && (
          <motion.div
            {...MODAL_BACKDROP}
            transition={{ duration: MOTION_DURATION.base }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/45 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="rank-up-title"
          >
            <Confetti />
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="relative flex w-full max-w-sm flex-col items-center gap-3 rounded-[28px] bg-paper px-6 pb-6 pt-7 text-center shadow-organic-lg dark:bg-zinc-900"
            >
              <span className="text-[11px] font-black uppercase tracking-[.1em] text-sage-800 dark:text-sage-300">
                You rose to rank {index + 1} of {RANKS.length}
              </span>
              <motion.span initial={{ scale: 0.4, rotate: -12 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 260, damping: 14, delay: 0.1 }}>
                <RankBadge index={index} size="lg" />
              </motion.span>
              <h2 id="rank-up-title" className="font-heading text-[32px] leading-tight text-ink dark:text-zinc-100">
                {rank.title}
              </h2>
              <p className="text-sm font-semibold text-ink-muted">
                {index > 0 ? `Up from ${RANKS[index - 1].title} · ` : ""}
                {rank.min.toLocaleString()} verses by heart
              </p>
              <blockquote className="flex flex-col gap-1 rounded-[20px] bg-sand-100 px-4 py-3 dark:bg-zinc-800">
                <span className="font-serif text-[17px] leading-snug text-brand-800 dark:text-brand-200">“{rank.verse}”</span>
                <span className="text-xs font-extrabold uppercase tracking-[.06em] text-sand-700 dark:text-zinc-400">{rank.reference} (KJV)</span>
              </blockquote>
              <motion.button
                type="button"
                whileTap={TAP_SCALE}
                onClick={onClose}
                className="mt-1 rounded-2xl bg-brand-500 px-7 py-3 text-sm font-black uppercase tracking-[.08em] text-white shadow-[0_4px_0_#8C491A]"
              >
                Keep going
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </BodyPortal>
  );
}
