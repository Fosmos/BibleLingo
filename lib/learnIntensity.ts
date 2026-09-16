// Data table for the Learn intensity slider (see LearnIntensityPicker.tsx) — 5 preset levels
// from least time/weakest encoding to most time/strongest encoding. Every level keeps the same
// floor of per-verse stages (Speak with a first-letter hint, Type by first letter, Speak with
// nothing) plus whatever stages it adds on top — these are the same four booleans
// LearnSection.tsx's buildSteps/versePhases already gate the flattened step list on (see
// UserProgress.understandStageEnabled etc. in types/index.ts). Listen and Rhythm are each a
// separate, global Profile > Advanced toggle instead (see kineticTextStageEnabled/
// rhythmStageEnabled) — not part of this per-path slider — so they're not represented in the
// floor above either; Listen still runs by default (see its own doc comment), just not
// something this particular picker controls. Review, Pray, and cumulative multiverse review
// are unconditional at every level, by design — never touched here.
export interface LearnIntensityLevel {
  level: number;
  label: string;
  description: string;
  // Rough total seconds per new verse at this level, across the whole Learn day (not just the
  // stage this level adds) — shown next to the slider so the time/encoding tradeoff is legible
  // before the reader picks. Approximate, not measured — tripled from an earlier, much-too-
  // fast first pass at these numbers per direct user feedback.
  estimateSecondsPerVerse: number;
  understandStageEnabled: boolean;
  visualizeStageEnabled: boolean;
  writeFirstLetterStageEnabled: boolean;
  fillInTheBlankStageEnabled: boolean;
}

// The four stage booleans alone, without a level's label/description/estimate — what
// LearnIntensityPicker's "Customize" checkboxes edit directly, and what GuidedPathFlow hands
// off to the four setter actions in store/learnSettingsActions.ts.
export type LearnIntensityStages = Pick<
  LearnIntensityLevel,
  "understandStageEnabled" | "visualizeStageEnabled" | "writeFirstLetterStageEnabled" | "fillInTheBlankStageEnabled"
>;

export const LEARN_INTENSITY_LEVELS: LearnIntensityLevel[] = [
  {
    level: 1,
    label: "Quick Pass",
    description: "Speak with a first-letter hint, Type it by first letter, Speak with nothing.",
    estimateSecondsPerVerse: 135,
    understandStageEnabled: false,
    visualizeStageEnabled: false,
    writeFirstLetterStageEnabled: false,
    fillInTheBlankStageEnabled: false,
  },
  {
    level: 2,
    label: "+ Fill in the Blank",
    description: "Adds a word-bank tap exercise and a type-the-first-letter exercise, both before the Speak hint, each run twice (half blanked, then all blanked).",
    estimateSecondsPerVerse: 325,
    understandStageEnabled: false,
    visualizeStageEnabled: false,
    writeFirstLetterStageEnabled: false,
    fillInTheBlankStageEnabled: true,
  },
  {
    level: 3,
    label: "+ Visualize",
    description: "Adds a Loci/Peg + Who/Action/scene step at the start of the day.",
    estimateSecondsPerVerse: 400,
    understandStageEnabled: false,
    visualizeStageEnabled: true,
    writeFirstLetterStageEnabled: false,
    fillInTheBlankStageEnabled: true,
  },
  {
    level: 4,
    label: "+ Write First Letter",
    description: "Adds a handwriting-recognition canvas for each word's first letter.",
    estimateSecondsPerVerse: 490,
    understandStageEnabled: false,
    visualizeStageEnabled: true,
    writeFirstLetterStageEnabled: true,
    fillInTheBlankStageEnabled: true,
  },
  {
    level: 5,
    label: "+ Understand",
    description: "Adds a clause-tagging step at the start of the day — the strongest encoding.",
    estimateSecondsPerVerse: 580,
    understandStageEnabled: true,
    visualizeStageEnabled: true,
    writeFirstLetterStageEnabled: true,
    fillInTheBlankStageEnabled: true,
  },
];

export function formatIntensityEstimate(secondsPerVerse: number): string {
  if (secondsPerVerse < 60) return `~${secondsPerVerse}s / verse`;
  const minutes = Math.round((secondsPerVerse / 60) * 10) / 10;
  return `~${minutes} min / verse`;
}

// Level 1's own 135s/verse floor, then each optional stage's own additive share worked out
// from the gap between consecutive LEARN_INTENSITY_LEVELS entries above (e.g. level 2 minus
// level 1 = Fill in the Blank's own 60s). Reconstructed this way, rather than looked up from
// the preset table directly, because a reader's actual four booleans (Customize Stages) don't
// have to match any single preset level — DayPathDiagram.tsx's own "Today's Lesson" estimate
// needs to work for any combination, not just the five named presets.
const BASE_SECONDS_PER_VERSE = 135;
// Now covers FOUR total passes over the verse (see lib/learnSteps.ts's versePhases): the
// word-bank tap exercise's own 2 reps (FillInTheBlankRep.tsx) plus the type-the-first-letter
// exercise's own 2 reps (FirstLetterBlankRep.tsx), both gated on this one setting.
const FILL_IN_THE_BLANK_SECONDS_PER_VERSE = 190;
const VISUALIZE_SECONDS_PER_VERSE = 75;
const WRITE_FIRST_LETTER_SECONDS_PER_VERSE = 90;
const UNDERSTAND_SECONDS_PER_VERSE = 90;

export function estimateLessonSeconds(verseCount: number, stages: LearnIntensityStages): number {
  let perVerse = BASE_SECONDS_PER_VERSE;
  if (stages.fillInTheBlankStageEnabled) perVerse += FILL_IN_THE_BLANK_SECONDS_PER_VERSE;
  if (stages.visualizeStageEnabled) perVerse += VISUALIZE_SECONDS_PER_VERSE;
  if (stages.writeFirstLetterStageEnabled) perVerse += WRITE_FIRST_LETTER_SECONDS_PER_VERSE;
  if (stages.understandStageEnabled) perVerse += UNDERSTAND_SECONDS_PER_VERSE;
  return perVerse * verseCount;
}

export function formatLessonDuration(totalSeconds: number): string {
  const minutes = Math.round(totalSeconds / 60);
  return minutes <= 0 ? "<1 min" : `${minutes} min${minutes === 1 ? "" : "s"}`;
}
