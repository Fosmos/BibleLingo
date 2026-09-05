// Data table for the Learn intensity slider (see LearnIntensityPicker.tsx) — 5 preset levels
// from least time/weakest encoding to most time/strongest encoding. Every level keeps the same
// floor of per-verse stages (Rhythm, Speak with a first-letter hint, Type by first letter,
// Speak with nothing) plus whatever stages it adds on top — these are the same four booleans
// LearnSection.tsx's buildSteps/versePhases already gate the flattened step list on (see
// UserProgress.understandStageEnabled etc. in types/index.ts). Review, Pray, and cumulative
// multiverse review are unconditional at every level, by design — never touched here.
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
    description: "Rhythm, Speak with a first-letter hint, Type it by first letter, Speak with nothing.",
    estimateSecondsPerVerse: 135,
    understandStageEnabled: false,
    visualizeStageEnabled: false,
    writeFirstLetterStageEnabled: false,
    fillInTheBlankStageEnabled: false,
  },
  {
    level: 2,
    label: "+ Fill in the Blank",
    description: "Adds a word-bank tap exercise right after the Speak hint.",
    estimateSecondsPerVerse: 195,
    understandStageEnabled: false,
    visualizeStageEnabled: false,
    writeFirstLetterStageEnabled: false,
    fillInTheBlankStageEnabled: true,
  },
  {
    level: 3,
    label: "+ Visualize",
    description: "Adds a Loci/Peg + Who/Action/scene step at the start of the day.",
    estimateSecondsPerVerse: 270,
    understandStageEnabled: false,
    visualizeStageEnabled: true,
    writeFirstLetterStageEnabled: false,
    fillInTheBlankStageEnabled: true,
  },
  {
    level: 4,
    label: "+ Write First Letter",
    description: "Adds a handwriting-recognition canvas for each word's first letter.",
    estimateSecondsPerVerse: 360,
    understandStageEnabled: false,
    visualizeStageEnabled: true,
    writeFirstLetterStageEnabled: true,
    fillInTheBlankStageEnabled: true,
  },
  {
    level: 5,
    label: "+ Understand",
    description: "Adds a clause-tagging step at the start of the day — the strongest encoding.",
    estimateSecondsPerVerse: 450,
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
