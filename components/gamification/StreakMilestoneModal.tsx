"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Trophy, Snowflake } from "lucide-react";
import { MODAL_BACKDROP, MODAL_CARD, MOTION_DURATION, TAP_SCALE } from "@/lib/motionTokens";

interface StreakMilestoneModalProps {
  open: boolean;
  streakCount: number;
  onClose: () => void;
}

export function StreakMilestoneModal({ open, streakCount, onClose }: StreakMilestoneModalProps) {
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          {...MODAL_BACKDROP}
          transition={{ duration: MOTION_DURATION.base }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="streak-milestone-title"
        >
          <motion.div
            {...MODAL_CARD}
            transition={{ duration: MOTION_DURATION.base }}
            className="flex w-full max-w-sm flex-col items-center gap-3 rounded-2xl bg-white p-6 text-center dark:bg-zinc-900"
          >
            <Trophy size={40} className="text-gold-500" />
            <h2 id="streak-milestone-title" className="text-title text-gold-600">
              {streakCount}-day streak!
            </h2>
            <p className="flex items-center gap-1.5 text-ink-muted">
              <Snowflake size={16} className="text-brand-400" />+1 streak freeze earned
            </p>
            <motion.button
              type="button"
              whileTap={TAP_SCALE}
              onClick={onClose}
              className="mt-2 rounded-full bg-gold-500 px-6 py-2 text-sm font-semibold text-white"
            >
              Keep going
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
