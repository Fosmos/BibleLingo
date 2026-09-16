"use client";

import { motion } from "framer-motion";
import type { SrsPhase } from "@/lib/srs";
import { TAP_SCALE } from "@/lib/motionTokens";

interface PhaseOption {
  phase: SrsPhase;
  label: string;
  description: string;
}

const OPTIONS: PhaseOption[] = [
  { phase: "daily", label: "Just memorized it", description: "Start it fresh in Box 1 — review daily at first, like any new verse." },
  { phase: "every3days", label: "Know it a little", description: "Skip ahead to Box 2 — review every 3 days at first." },
  { phase: "weekly", label: "Know it fairly well", description: "Skip ahead to Box 3 — the weekly review rotation." },
  { phase: "biweekly", label: "Know it well", description: "Skip ahead to Box 4 — the biweekly review rotation." },
  { phase: "monthly", label: "Know it solidly", description: "Skip ahead to Box 5 — the monthly review rotation." },
];

interface SrsPhasePickerProps {
  label: string;
  onSelectPhase: (phase: SrsPhase) => void;
  onBack: () => void;
}

export function SrsPhasePicker({ label, onSelectPhase, onBack }: SrsPhasePickerProps) {
  return (
    <div className="flex flex-col gap-3">
      <button type="button" onClick={onBack} className="self-start text-sm font-medium text-brand-600 hover:underline">
        ← Back
      </button>
      <p className="text-sm text-ink-muted">
        How well do you already know <span className="font-semibold text-ink-soft dark:text-zinc-300">{label}</span>? This
        decides where it starts in your review schedule.
      </p>
      <div className="flex flex-col gap-2">
        {OPTIONS.map(({ phase, label: optionLabel, description }) => (
          <motion.button
            key={phase}
            type="button"
            whileTap={TAP_SCALE}
            onClick={() => onSelectPhase(phase)}
            className="flex flex-col items-start gap-1 rounded-xl border border-line bg-white p-4 text-left dark:border-zinc-800 dark:bg-zinc-900"
          >
            <span className="text-sm font-semibold text-ink dark:text-zinc-200">{optionLabel}</span>
            <span className="text-xs text-ink-muted">{description}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
