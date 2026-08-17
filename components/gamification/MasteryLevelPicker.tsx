"use client";

import { motion } from "framer-motion";
import { Star, Trophy } from "lucide-react";
import { MASTERY_LEVELS } from "@/lib/masteryMode";
import { TAP_SCALE } from "@/lib/motionTokens";
import { InfoTip } from "@/components/ui/InfoTip";
import { INFO_TIPS } from "@/lib/infoTipCopy";

interface MasteryLevelPickerProps {
  passageLabel: string;
  bestLevel: number;
  onSelectLevel: (level: number) => void;
  onBack: () => void;
}

export function MasteryLevelPicker({ passageLabel, bestLevel, onSelectLevel, onBack }: MasteryLevelPickerProps) {
  const mastered = bestLevel >= MASTERY_LEVELS.length;

  return (
    <div className="flex flex-col gap-4">
      <button type="button" onClick={onBack} className="self-start text-sm font-medium text-brand-600 hover:underline">
        ← Choose a different passage
      </button>
      <div>
        <p className="flex items-center gap-1.5 text-caption font-semibold uppercase tracking-wide text-brand-500">
          Mastery Mode <InfoTip text={INFO_TIPS.masteryLevelPicker} />
        </p>
        <h3 className="text-title">{passageLabel}</h3>
      </div>
      <div className="flex flex-col gap-2">
        {MASTERY_LEVELS.map((level) => {
          const cleared = bestLevel >= level.level;
          return (
            <motion.button
              key={level.level}
              type="button"
              whileTap={TAP_SCALE}
              onClick={() => onSelectLevel(level.level)}
              className={`flex items-center justify-between gap-3 rounded-xl border p-4 text-left ${
                cleared
                  ? "border-brand-300 bg-brand-50 dark:border-brand-800 dark:bg-brand-950"
                  : "border-line bg-white dark:border-zinc-800 dark:bg-zinc-900"
              }`}
            >
              <div>
                <p className="text-sm font-semibold text-ink dark:text-zinc-200">
                  {level.label} — {level.tagline}
                </p>
                <p className="text-xs text-ink-muted">{level.description}</p>
              </div>
              {cleared && <Star size={20} className="shrink-0 fill-brand-500 text-brand-500" />}
            </motion.button>
          );
        })}
      </div>
      {mastered && (
        <p className="flex items-center justify-center gap-2 text-center text-sm font-semibold text-brand-600">
          <Trophy size={18} /> This passage is Mastered.
        </p>
      )}
    </div>
  );
}
