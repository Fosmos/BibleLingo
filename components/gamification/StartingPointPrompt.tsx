"use client";

import { motion } from "framer-motion";
import { TAP_SCALE } from "@/lib/motionTokens";

interface StartingPointPromptProps {
  label: string;
  onStartFromBeginning: () => void;
  onPickStartingPoint: () => void;
  onBack: () => void;
}

// GuidedPathFlow.tsx's own last step before actually creating a book/chapter path — lets a
// reader who's already worked through part of it by hand skip the lessons that would just
// repeat verses they already know, instead of always landing on day 1. Verse-mode paths never
// reach this (a single verse has nothing to "already know part of"), and it always defaults
// to starting fresh — this step only ever WIDENS what a plain "start the path" click already
// did before it existed.
export function StartingPointPrompt({ label, onStartFromBeginning, onPickStartingPoint, onBack }: StartingPointPromptProps) {
  return (
    <div className="flex flex-col gap-4">
      <button type="button" onClick={onBack} className="self-start text-sm font-medium text-brand-600 hover:underline">
        ← Back
      </button>
      <h3 className="text-title">{label}</h3>
      <p className="text-sm text-ink-muted">Have you already memorized part of this?</p>
      <div className="flex flex-col gap-2">
        <motion.button
          type="button"
          whileTap={TAP_SCALE}
          onClick={onStartFromBeginning}
          className="flex flex-col items-start gap-1 rounded-xl border border-line bg-white p-4 text-left dark:border-zinc-800 dark:bg-zinc-900"
        >
          <span className="text-sm font-semibold text-ink dark:text-zinc-200">No, start from the beginning</span>
          <span className="text-xs text-ink-muted">Day 1 opens up first, like any new path.</span>
        </motion.button>
        <motion.button
          type="button"
          whileTap={TAP_SCALE}
          onClick={onPickStartingPoint}
          className="flex flex-col items-start gap-1 rounded-xl border border-line bg-white p-4 text-left dark:border-zinc-800 dark:bg-zinc-900"
        >
          <span className="text-sm font-semibold text-ink dark:text-zinc-200">Yes, I already know some of it</span>
          <span className="text-xs text-ink-muted">Pick where you&apos;ve gotten to — this path jumps ahead to the first lesson after that.</span>
        </motion.button>
      </div>
    </div>
  );
}
