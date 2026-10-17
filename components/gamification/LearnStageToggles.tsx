"use client";

import { useProgressStore } from "@/store/useProgressStore";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";
import { InfoTip } from "@/components/ui/InfoTip";
import { INFO_TIPS } from "@/lib/infoTipCopy";

// The optional Learn stages — split out of ProfileAdvancedSettings.tsx purely to keep that file
// under this codebase's 200-line cap. Every lesson runs Listen & Repeat, Fill in the blank, Say it
// with hints, Type it by first letter and Say it from memory (lib/learnSteps.ts) — sense line by
// sense line, or over the whole verse with "Learn line by line" off; the rest add to that, off
// by default.
export function LearnStageToggles() {
  const understandStageEnabled = useProgressStore((state) => state.understandStageEnabled);
  const setUnderstandStageEnabled = useProgressStore((state) => state.setUnderstandStageEnabled);
  const visualizeStageEnabled = useProgressStore((state) => state.visualizeStageEnabled);
  const setVisualizeStageEnabled = useProgressStore((state) => state.setVisualizeStageEnabled);
  const writeFirstLetterStageEnabled = useProgressStore((state) => state.writeFirstLetterStageEnabled);
  const setWriteFirstLetterStageEnabled = useProgressStore((state) => state.setWriteFirstLetterStageEnabled);
  const rhythmStageEnabled = useProgressStore((state) => state.rhythmStageEnabled) ?? false;
  const setRhythmStageEnabled = useProgressStore((state) => state.setRhythmStageEnabled);
  const lineByLine = !(useProgressStore((state) => state.wholeVerseLearning) ?? false);
  const setWholeVerseLearning = useProgressStore((state) => state.setWholeVerseLearning);

  return (
    <>
      <ToggleSwitch
        checked={lineByLine}
        onChange={(value) => setWholeVerseLearning(!value)}
        label="Learn line by line"
        description="Each verse a sense line at a time, each new line recalled with the lines before it. Off learns the whole verse at once — the same stages over the full verse."
      />
      <p className="text-sm text-ink-muted">Add any of these extra stages:</p>
      <div className="flex items-start gap-1.5">
        <ToggleSwitch
          checked={understandStageEnabled}
          onChange={setUnderstandStageEnabled}
          label="Understand stage"
          description="A clause-tagging step at the start of each Learn day — tap words apart into clauses and color-tag their role before drilling into them"
        />
        <InfoTip text={INFO_TIPS.understandStageToggle} />
      </div>
      <div className="flex items-start gap-1.5">
        <ToggleSwitch
          checked={visualizeStageEnabled}
          onChange={setVisualizeStageEnabled}
          label="Visualize stage"
          description="A Loci/Peg + Who/Action/scene step at the start of each Learn day — build a vivid mental picture before drilling into the verse"
        />
        <InfoTip text={INFO_TIPS.visualizeStageToggle} />
      </div>
      <div className="flex items-start gap-1.5">
        <ToggleSwitch
          checked={writeFirstLetterStageEnabled}
          onChange={setWriteFirstLetterStageEnabled}
          label="Write First Letter stage"
          description="A handwriting-recognition canvas once each verse's lines are learned — draw each word's first letter, punctuation mark, or verse number"
        />
        <InfoTip text={INFO_TIPS.writeFirstLetterStageToggle} />
      </div>
      <div className="flex items-start gap-1.5">
        <ToggleSwitch
          checked={rhythmStageEnabled}
          onChange={setRhythmStageEnabled}
          label="Rhythm stage"
          description="A tap-through-the-words pacing drill for each verse, before its lines are learned"
        />
        <InfoTip text={INFO_TIPS.rhythmStageToggle} />
      </div>
    </>
  );
}
