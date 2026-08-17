"use client";

import { motion } from "framer-motion";
import { TAP_SCALE } from "@/lib/motionTokens";

interface MasteryKeyboardProps {
  onKeyPress: (letter: string) => void;
  disabled?: boolean;
}

const ROWS = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];

// A touch-first on-screen QWERTY overlay for Mastery Mode's letter input — every key is
// just a button that reports its own letter upward, so the same handler that drives the
// runner also drives the keyboard. A real keyboard still works too (MasteryChaseRound keeps
// a physical-key listener alongside this), so this is additive rather than a replacement.
export function MasteryKeyboard({ onKeyPress, disabled }: MasteryKeyboardProps) {
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-2xl border border-line bg-white p-2.5 dark:border-zinc-800 dark:bg-zinc-900">
      {ROWS.map((row) => (
        <div key={row} className="flex justify-center gap-1.5">
          {row.split("").map((letter) => (
            <motion.button
              key={letter}
              type="button"
              whileTap={TAP_SCALE}
              disabled={disabled}
              onClick={() => onKeyPress(letter)}
              aria-label={`Type letter ${letter}`}
              className="flex h-10 w-8 items-center justify-center rounded-lg border border-line bg-paper text-sm font-medium text-ink shadow-sm transition-colors active:bg-mist disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            >
              {letter}
            </motion.button>
          ))}
        </div>
      ))}
    </div>
  );
}
