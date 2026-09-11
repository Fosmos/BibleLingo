"use client";

import { motion } from "framer-motion";
import { Mic, Square } from "lucide-react";
import { TAP_SCALE } from "@/lib/motionTokens";

interface SpeakRepMicButtonProps {
  isListening: boolean;
  onStart: () => void;
  onStop: () => void;
}

// SpeakRep.tsx's own start/stop mic control, split out purely to keep that file under this
// codebase's 200-line cap.
export function SpeakRepMicButton({ isListening, onStart, onStop }: SpeakRepMicButtonProps) {
  if (!isListening) {
    return (
      <div className="flex items-center gap-3">
        <motion.button
          type="button"
          whileTap={TAP_SCALE}
          onClick={onStart}
          aria-label="Start speaking"
          className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-500 text-white shadow-sm hover:bg-brand-600"
        >
          <Mic size={26} />
        </motion.button>
        <span className="text-sm text-ink-muted">Tap to allow mic & recite</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <motion.button
        type="button"
        whileTap={TAP_SCALE}
        onClick={onStop}
        aria-label="Done speaking"
        className="flex h-16 w-16 items-center justify-center rounded-full bg-heart-500 text-white shadow-sm animate-pulse"
      >
        <Square size={22} />
      </motion.button>
      <span className="text-sm text-ink-muted">Tap when finished reciting</span>
    </div>
  );
}
