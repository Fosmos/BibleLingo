"use client";

import { useProgressStore } from "@/store/useProgressStore";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";
import { InfoTip } from "@/components/ui/InfoTip";
import { INFO_TIPS } from "@/lib/infoTipCopy";

// The six individual Learn-stage toggles — split out of ProfileAdvancedSettings.tsx purely to
// keep that file under this codebase's 200-line cap. Listen defaults ON and Rhythm defaults
// OFF (both self-heal via `?? …` for a reader whose saved progress predates one of these
// fields — see their own doc comments on UserProgress in types/index.ts for why the two
// swapped roles): Listen is now the default introduction to each fresh verse, and Rhythm is
// the deliberate opt-in for a reader who still wants that per-verse tap-through pacing too.
export function LearnStageToggles() {
  const understandStageEnabled = useProgressStore((state) => state.understandStageEnabled);
  const setUnderstandStageEnabled = useProgressStore((state) => state.setUnderstandStageEnabled);
  const visualizeStageEnabled = useProgressStore((state) => state.visualizeStageEnabled);
  const setVisualizeStageEnabled = useProgressStore((state) => state.setVisualizeStageEnabled);
  const writeFirstLetterStageEnabled = useProgressStore((state) => state.writeFirstLetterStageEnabled);
  const setWriteFirstLetterStageEnabled = useProgressStore((state) => state.setWriteFirstLetterStageEnabled);
  const fillInTheBlankStageEnabled = useProgressStore((state) => state.fillInTheBlankStageEnabled);
  const setFillInTheBlankStageEnabled = useProgressStore((state) => state.setFillInTheBlankStageEnabled);
  const kineticTextStageEnabled = useProgressStore((state) => state.kineticTextStageEnabled) ?? true;
  const setKineticTextStageEnabled = useProgressStore((state) => state.setKineticTextStageEnabled);
  const rhythmStageEnabled = useProgressStore((state) => state.rhythmStageEnabled) ?? false;
  const setRhythmStageEnabled = useProgressStore((state) => state.setRhythmStageEnabled);

  return (
    <>
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
          description="A handwriting-recognition canvas during each verse's Learn stages — draw each word's first letter, punctuation mark, or verse number"
        />
        <InfoTip text={INFO_TIPS.writeFirstLetterStageToggle} />
      </div>
      <div className="flex items-start gap-1.5">
        <ToggleSwitch
          checked={fillInTheBlankStageEnabled}
          onChange={setFillInTheBlankStageEnabled}
          label="Fill in the Blank stage"
          description="A word-bank tap exercise during each verse's Learn stages, right before the Speak hint"
        />
        <InfoTip text={INFO_TIPS.fillInTheBlankStageToggle} />
      </div>
      <div className="flex items-start gap-1.5">
        <ToggleSwitch
          checked={kineticTextStageEnabled}
          onChange={setKineticTextStageEnabled}
          label="Listen stage"
          description="The whole day's text read aloud right after Visualize, each word highlighted as it's spoken — on by default"
        />
        <InfoTip text={INFO_TIPS.kineticTextStageToggle} />
      </div>
      <div className="flex items-start gap-1.5">
        <ToggleSwitch
          checked={rhythmStageEnabled}
          onChange={setRhythmStageEnabled}
          label="Rhythm stage"
          description="A tap-through-the-words pacing drill for each verse, right before Write First Letter/Speak — off by default now that Listen covers that first introduction"
        />
        <InfoTip text={INFO_TIPS.rhythmStageToggle} />
      </div>
    </>
  );
}
