"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { WordDiffToken } from "@/types";
import { TAP_SCALE } from "@/lib/motionTokens";
import { MistakeDiff } from "@/components/drills/MistakeDiff";

interface ReviewChainResultProps {
  label: string;
  accuracy: number;
  totalWords: number;
  wrongCount: number;
  mistakeTokens: WordDiffToken[];
  onComplete: () => void;
}

// ReviewChain.tsx's own completion screen, split out purely to keep that file under this
// codebase's 200-line cap — a plain centered summary rather than the parchment-card layout
// its own in-progress screen uses, since there's no verse text to actively work with here,
// just a result.
export function ReviewChainResult({ label, accuracy, totalWords, wrongCount, mistakeTokens, onComplete }: ReviewChainResultProps) {
  const [showMistakes, setShowMistakes] = useState(false);

  return (
    <div className="flex flex-col gap-4 text-center">
      <p className="text-caption font-semibold uppercase tracking-wide text-brand-500">{label} complete</p>
      <p className="text-title">{accuracy}% accuracy</p>
      <p className="text-sm text-ink-muted">
        {totalWords - wrongCount} of {totalWords} words correct on the first try.
      </p>
      {wrongCount > 0 && (
        <button
          type="button"
          onClick={() => setShowMistakes((prev) => !prev)}
          className="self-center text-sm font-medium text-brand-600 hover:underline"
        >
          {showMistakes ? "Hide mistakes" : "Review mistakes"}
        </button>
      )}
      {showMistakes && <MistakeDiff label="Words you missed the first time:" tokens={mistakeTokens} />}
      <motion.button
        type="button"
        whileTap={TAP_SCALE}
        onClick={onComplete}
        className="self-center rounded-full bg-brand-500 px-6 py-2 text-sm font-semibold text-white"
      >
        Continue
      </motion.button>
    </div>
  );
}
