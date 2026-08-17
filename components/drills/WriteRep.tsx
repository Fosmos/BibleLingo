"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { VerseSegment, WordDiffToken } from "@/types";
import { diffWords, fuzzyMatch } from "@/lib/textMatch";
import { playCorrectSfx, playIncorrectSfx } from "@/lib/audio";
import { TAP_SCALE } from "@/lib/motionTokens";
import { MistakeDiff } from "@/components/drills/MistakeDiff";
import { AutoCompleteButton } from "@/components/ui/AutoCompleteButton";
import { InfoTip } from "@/components/ui/InfoTip";
import { INFO_TIPS } from "@/lib/infoTipCopy";

interface WriteRepProps {
  verse: VerseSegment;
  reps: number;
  label: string;
  showVerse?: boolean;
  onComplete: () => void;
}

export function WriteRep({ verse, reps, label, showVerse, onComplete }: WriteRepProps) {
  const [completedReps, setCompletedReps] = useState(0);
  const [input, setInput] = useState("");
  const [mistake, setMistake] = useState<WordDiffToken[] | null>(null);

  function handleCheck() {
    if (fuzzyMatch(input, verse.text)) {
      playCorrectSfx();
      setMistake(null);
      setInput("");
      const next = completedReps + 1;
      if (next >= reps) {
        onComplete();
      } else {
        setCompletedReps(next);
      }
    } else {
      playIncorrectSfx();
      setMistake(diffWords(input, verse.text));
      setInput("");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="flex items-center gap-1.5 text-caption font-semibold uppercase tracking-wide text-brand-500">
          {label} <InfoTip text={INFO_TIPS.writeRep} />
        </p>
        <p className="text-title">{verse.reference}</p>
      </div>
      <p className="text-sm text-ink-muted">
        Rep {completedReps + 1} of {reps}
      </p>
      {showVerse && <p className="text-lg leading-relaxed">{verse.text}</p>}
      <textarea
        value={input}
        onChange={(event) => setInput(event.target.value)}
        rows={4}
        placeholder={showVerse ? "Type the verse shown above..." : "Type the full verse from memory..."}
        className={`rounded-xl border p-3 text-base focus:outline-none focus-visible:ring-2 dark:bg-zinc-900 ${
          mistake
            ? "border-heart-500 focus:border-heart-500 focus-visible:ring-heart-500"
            : "border-line focus:border-brand-500 focus-visible:ring-brand-500 dark:border-zinc-700"
        }`}
      />
      {mistake && <MistakeDiff label="Not quite — here's the correct verse:" tokens={mistake} />}
      <motion.button
        type="button"
        whileTap={input.trim().length > 0 ? TAP_SCALE : undefined}
        disabled={input.trim().length === 0}
        onClick={handleCheck}
        className="self-start rounded-full bg-brand-500 px-6 py-2 text-sm font-semibold text-white disabled:opacity-40"
      >
        Check
      </motion.button>
      <AutoCompleteButton onClick={onComplete} />
    </div>
  );
}
