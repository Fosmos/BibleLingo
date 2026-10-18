"use client";

import { useProgressStore } from "@/store/useProgressStore";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";
import { InfoTip } from "@/components/ui/InfoTip";
import { INFO_TIPS } from "@/lib/infoTipCopy";

// The optional Learn stages — split out of ProfileAdvancedSettings.tsx purely to keep that file
// under this codebase's 200-line cap. Every lesson runs Listen & Repeat, Fill in the blank, Say it
// with hints, Type it by first letter and Say it from memory (lib/learnSteps.ts) — sense line by
// sense line, or over the whole verse with "Learn line by line" off. Fill in the vowels, Last
// letters and the end-of-verse challenges run too unless turned off; the rest add to that, off
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
  const vowelsStageEnabled = useProgressStore((state) => state.vowelsStageEnabled) ?? true;
  const setVowelsStageEnabled = useProgressStore((state) => state.setVowelsStageEnabled);
  const lastLettersStageEnabled = useProgressStore((state) => state.lastLettersStageEnabled) ?? true;
  const setLastLettersStageEnabled = useProgressStore((state) => state.setLastLettersStageEnabled);
  const timedType = useProgressStore((state) => state.timedTypeStageEnabled) ?? true;
  const payload = useProgressStore((state) => state.payloadStageEnabled) ?? true;
  const mathBreaks = useProgressStore((state) => state.mathBreakStageEnabled) ?? true;
  const setTimedType = useProgressStore((state) => state.setTimedTypeStageEnabled);
  const setPayload = useProgressStore((state) => state.setPayloadStageEnabled);
  const setMathBreaks = useProgressStore((state) => state.setMathBreakStageEnabled);

  return (
    <>
      <ToggleSwitch
        checked={lineByLine}
        onChange={(value) => setWholeVerseLearning(!value)}
        label="Learn line by line"
        description="Each verse a sense line at a time, each new line recalled with the lines before it. Off learns the whole verse at once — the same stages over the full verse."
      />
      <ToggleSwitch
        checked={vowelsStageEnabled}
        onChange={setVowelsStageEnabled}
        label="Fill in the vowels"
        description="Each line with its vowels blank — type the missing vowels in, in order."
      />
      <ToggleSwitch
        checked={lastLettersStageEnabled}
        onChange={setLastLettersStageEnabled}
        label="Last letters"
        description="Only each word's last letter shows — type every word's first letter, before the first letters are typed with nothing showing."
      />
      <p className="text-sm text-ink-muted">Once each verse is learned, the whole verse:</p>
      <ToggleSwitch checked={timedType} onChange={setTimedType} label="Against the clock" description="Type it by first letter with a timer that starts on your first letter." />
      <ToggleSwitch
        checked={payload}
        onChange={setPayload}
        label="Hold the code"
        description="A number and color flash up for 2 seconds before you say it from memory — pick them both after to move on."
      />
      <ToggleSwitch checked={mathBreaks} onChange={setMathBreaks} label="Math breaks" description="Type it by first letter, with a quick math problem to answer after each sense line." />
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
