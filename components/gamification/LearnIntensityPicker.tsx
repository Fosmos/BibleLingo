"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { LEARN_INTENSITY_LEVELS, formatIntensityEstimate, type LearnIntensityStages } from "@/lib/learnIntensity";
import { TAP_SCALE } from "@/lib/motionTokens";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";
import { InfoTip } from "@/components/ui/InfoTip";
import { INFO_TIPS } from "@/lib/infoTipCopy";

interface LearnIntensityPickerProps {
  // Seeds for the "Customize" checkboxes and the Memory Palace checkbox — whatever's on right
  // now in Profile (see app/profile/page.tsx), so opening this step doesn't silently reset
  // anything the reader already chose.
  initialStages: LearnIntensityStages;
  initialMemoryPalace: boolean;
  onContinue: (stages: LearnIntensityStages, memoryPalace: boolean) => void;
  onBack: () => void;
}

const DEFAULT_LEVEL = 3;

export function LearnIntensityPicker({ initialStages, initialMemoryPalace, onContinue, onBack }: LearnIntensityPickerProps) {
  const [level, setLevel] = useState(DEFAULT_LEVEL);
  const [customize, setCustomize] = useState(false);
  const [customStages, setCustomStages] = useState<LearnIntensityStages>(initialStages);
  const [memoryPalace, setMemoryPalace] = useState(initialMemoryPalace);

  const preset = LEARN_INTENSITY_LEVELS[level - 1];
  const stages: LearnIntensityStages = customize
    ? customStages
    : {
        understandStageEnabled: preset.understandStageEnabled,
        visualizeStageEnabled: preset.visualizeStageEnabled,
        writeFirstLetterStageEnabled: preset.writeFirstLetterStageEnabled,
        fillInTheBlankStageEnabled: preset.fillInTheBlankStageEnabled,
      };

  function patchCustomStage(key: keyof LearnIntensityStages, value: boolean) {
    setCustomStages((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="flex flex-col gap-4">
      <button type="button" onClick={onBack} className="self-start text-sm font-medium text-brand-600 hover:underline">
        ← Back
      </button>
      <h3 className="flex items-center gap-1.5 text-title">
        How intensely do you want to learn each verse? <InfoTip text={INFO_TIPS.learnIntensitySlider} />
      </h3>

      {!customize && (
        <div className="flex flex-col gap-2 rounded-2xl border border-line bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
          <input
            type="range"
            min={1}
            max={5}
            step={1}
            value={level}
            onChange={(event) => setLevel(Number(event.target.value))}
            className="w-full accent-brand-500"
            aria-label="Learn intensity"
          />
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-ink dark:text-zinc-100">{preset.label}</span>
            <span className="text-xs font-medium text-brand-600">{formatIntensityEstimate(preset.estimateSecondsPerVerse)}</span>
          </div>
          <p className="text-xs text-ink-muted">{preset.description}</p>
          <div className="flex justify-between text-[10px] uppercase tracking-wide text-ink-muted">
            <span>Least time</span>
            <span>Most time</span>
          </div>
        </div>
      )}

      <div className="flex items-start gap-1.5">
        <ToggleSwitch
          checked={customize}
          onChange={setCustomize}
          label="Customize stages"
          description="Pick exactly which stages run, instead of a preset level"
        />
        <InfoTip text={INFO_TIPS.customizeStagesToggle} />
      </div>

      {customize && (
        <div className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
          <ToggleSwitch
            checked={stages.fillInTheBlankStageEnabled}
            onChange={(value) => patchCustomStage("fillInTheBlankStageEnabled", value)}
            label="Fill in the Blank"
            description="A word-bank tap exercise, right after the Speak hint"
          />
          <ToggleSwitch
            checked={stages.visualizeStageEnabled}
            onChange={(value) => patchCustomStage("visualizeStageEnabled", value)}
            label="Visualize"
            description="A Loci/Peg + Who/Action/scene step at the start of the day"
          />
          <ToggleSwitch
            checked={stages.writeFirstLetterStageEnabled}
            onChange={(value) => patchCustomStage("writeFirstLetterStageEnabled", value)}
            label="Write First Letter"
            description="A handwriting-recognition canvas for each word's first letter"
          />
          <ToggleSwitch
            checked={stages.understandStageEnabled}
            onChange={(value) => patchCustomStage("understandStageEnabled", value)}
            label="Understand"
            description="A clause-tagging step at the start of the day"
          />
        </div>
      )}

      <div className="flex items-start gap-1.5">
        <ToggleSwitch checked={memoryPalace} onChange={setMemoryPalace} label="Memory Palace" description="Add location tags to this path" />
        <InfoTip text={INFO_TIPS.memoryPalaceToggle} />
      </div>

      <motion.button
        type="button"
        whileTap={TAP_SCALE}
        onClick={() => onContinue(stages, memoryPalace)}
        className="self-start rounded-full bg-brand-500 px-6 py-2 text-sm font-semibold text-white"
      >
        Continue
      </motion.button>
    </div>
  );
}
