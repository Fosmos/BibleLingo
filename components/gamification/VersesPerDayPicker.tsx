"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { motion } from "framer-motion";
import { TAP_SCALE } from "@/lib/motionTokens";
import { InfoTip } from "@/components/ui/InfoTip";
import { INFO_TIPS } from "@/lib/infoTipCopy";

interface VersesPerDayPickerProps {
  totalVerses: number;
  onSelect: (versesPerDay: number) => void;
  onBack: () => void;
  // Book mode's sliding-window review differs from every other path kind's "review
  // everything learned so far" — callers supply the description that matches their kind.
  description?: string;
}

const QUICK_PICKS = [1, 3, 5, 10, 20];

export function VersesPerDayPicker({ totalVerses, onSelect, onBack, description }: VersesPerDayPickerProps) {
  const picks = QUICK_PICKS.filter((count) => count < totalVerses);
  const [customValue, setCustomValue] = useState("");

  function handleCustomSubmit(event: FormEvent) {
    event.preventDefault();
    const parsed = Math.floor(Number(customValue));
    if (Number.isInteger(parsed) && parsed > 0) {
      onSelect(Math.min(parsed, totalVerses));
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <button type="button" onClick={onBack} className="self-start text-sm font-medium text-brand-600 hover:underline">
        ← Back
      </button>
      <h3 className="flex items-center gap-1.5 text-title">
        How many verses per day? <InfoTip text={INFO_TIPS.versesPerDayPicker} />
      </h3>
      <p className="text-sm text-ink-muted">
        {totalVerses} verses total —{" "}
        {description ?? "each lesson reviews the last two chapters, then learns this many new verses."}
      </p>
      <div className="flex flex-wrap gap-2">
        {picks.map((count) => (
          <motion.button
            key={count}
            type="button"
            whileTap={TAP_SCALE}
            onClick={() => onSelect(count)}
            className="rounded-full bg-brand-500 px-5 py-2 text-sm font-semibold text-white"
          >
            {count}
          </motion.button>
        ))}
        <motion.button
          type="button"
          whileTap={TAP_SCALE}
          onClick={() => onSelect(totalVerses)}
          className="rounded-full bg-gold-500 px-5 py-2 text-sm font-semibold text-white"
        >
          All {totalVerses}
        </motion.button>
      </div>
      <form onSubmit={handleCustomSubmit} className="flex items-center gap-2">
        <input
          type="number"
          inputMode="numeric"
          min={1}
          max={totalVerses}
          value={customValue}
          onChange={(event) => setCustomValue(event.target.value)}
          placeholder="Custom amount"
          aria-label="Custom verses per day"
          className="w-36 rounded-full border border-line bg-white px-4 py-2 text-sm text-ink dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        />
        <motion.button
          type="submit"
          whileTap={TAP_SCALE}
          disabled={!customValue}
          className="rounded-full bg-brand-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-40"
        >
          Start
        </motion.button>
      </form>
    </div>
  );
}
