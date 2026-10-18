"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import type { Payload } from "@/lib/memoryChallenges";
import { BodyPortal } from "@/components/ui/BodyPortal";

interface PayloadFlashProps {
  payload: Payload;
  onDone: () => void;
}

const SHOW_SECONDS = 2;
const FADE_SECONDS = 0.6;

// The payload, shown before the verse is said from memory: a number on a swatch of its color,
// held for 2 seconds, then faded out — the reader keeps it in mind through the recitation. On
// the body, above the lesson page's own fixed layer.
export function PayloadFlash({ payload, onDone }: PayloadFlashProps) {
  useEffect(() => {
    const id = setTimeout(onDone, (SHOW_SECONDS + FADE_SECONDS) * 1000);
    return () => clearTimeout(id);
  }, [onDone]);

  return (
    <BodyPortal>
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ delay: SHOW_SECONDS, duration: FADE_SECONDS }}
        className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-4 bg-paper/95 dark:bg-zinc-950/95"
        role="dialog"
        aria-label={`Remember: ${payload.number}, ${payload.color.name}`}
      >
        <span className="text-[11px] font-black uppercase tracking-[.1em] text-sage-800 dark:text-sage-300">
          Remember this
        </span>
        <motion.span
          initial={{ scale: 0.6 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 18 }}
          className={`flex h-32 w-32 items-center justify-center rounded-[32px] font-heading text-[72px] leading-none text-white shadow-organic-lg ${payload.color.swatch}`}
        >
          {payload.number}
        </motion.span>
      </motion.div>
    </BodyPortal>
  );
}
