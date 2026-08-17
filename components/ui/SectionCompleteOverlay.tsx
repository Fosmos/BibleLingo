"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { playSectionCompleteSfx } from "@/lib/audio";
import { Confetti } from "@/components/ui/Confetti";

interface SectionCompleteOverlayProps {
  // Omitted for "smaller" sub-section completions (e.g. a single Learn stage) — those still
  // get the graphic + sound, just no label.
  text?: string;
  onDone: () => void;
}

const DISPLAY_MS = 850;

// A brief, non-interactive "section complete" beat — plays a chime and shows a burst
// graphic, then calls onDone on its own after a fixed delay. Orchestrators render this in
// place of their normal content via useCelebration rather than advancing immediately.
export function SectionCompleteOverlay({ text, onDone }: SectionCompleteOverlayProps) {
  useEffect(() => {
    playSectionCompleteSfx();
    const timeout = setTimeout(onDone, DISPLAY_MS);
    return () => clearTimeout(timeout);
    // Intentionally fire-once on mount — onDone is a fresh closure per render but this
    // overlay always unmounts (key-remounts) before it would need to re-fire.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/10 backdrop-blur-[1px]"
      aria-live="polite"
    >
      <Confetti />
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="relative flex flex-col items-center gap-2 rounded-3xl border border-line bg-white px-8 py-6 dark:border-zinc-700 dark:bg-zinc-900"
      >
        <Sparkles size={40} className="text-gold-500" />
        {text && <p className="text-title text-center text-brand-600">{text}</p>}
      </motion.div>
    </div>
  );
}
