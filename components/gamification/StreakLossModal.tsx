"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Flame } from "lucide-react";
import { MODAL_BACKDROP, MODAL_CARD, MOTION_DURATION, TAP_SCALE } from "@/lib/motionTokens";

interface StreakLossModalProps {
  open: boolean;
  previousStreak: number;
  onClose: () => void;
}

export function StreakLossModal({ open, previousStreak, onClose }: StreakLossModalProps) {
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
          aria-labelledby="streak-loss-title"
        >
          <motion.div
            {...MODAL_CARD}
            transition={{ duration: MOTION_DURATION.base }}
            className="flex w-full max-w-sm flex-col items-center gap-3 rounded-2xl bg-white p-6 text-center dark:bg-zinc-900"
          >
            <Flame size={40} className="text-heart-500" />
            <h2 id="streak-loss-title" className="text-title text-heart-600">
              Streak lost
            </h2>
            <p className="text-ink-muted">
              Your {previousStreak}-day streak has ended. Start a new one today — it only takes a
              minute.
            </p>
            <motion.button
              type="button"
              whileTap={TAP_SCALE}
              onClick={onClose}
              className="mt-2 rounded-full bg-brand-500 px-6 py-2 text-sm font-semibold text-white"
            >
              Got it
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
