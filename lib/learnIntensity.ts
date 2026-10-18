// Data table for the Learn intensity slider (see LearnIntensityPicker.tsx) — 4 preset levels
// from least time/weakest encoding to most time/strongest encoding. Every level keeps the same
// floor — every verse learned sense line by sense line (lib/learnSteps.ts) — plus whatever
// optional stages it adds on top: the same three booleans buildSteps gates them on (see
// UserProgress.understandStageEnabled etc. in types/index.ts). Rhythm is a separate, global
// Profile > Advanced toggle instead (rhythmStageEnabled), not part of this per-path slider.
// Review and cumulative multiverse review are unconditional at every level, by design; Pray is a
// separate Profile > Advanced toggle (prayStageEnabled), off by default.
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
}

// The three stage booleans alone, without a level's label/description/estimate — what
// LearnIntensityPicker's "Customize" checkboxes edit directly, and what GuidedPathFlow hands
// off to the three setter actions in store/learnSettingsActions.ts.
export type LearnIntensityStages = Pick<
  LearnIntensityLevel,
  "understandStageEnabled" | "visualizeStageEnabled" | "writeFirstLetterStageEnabled"
>;

export const LEARN_INTENSITY_LEVELS: LearnIntensityLevel[] = [
  {
    level: 1,
    label: "Sense lines",
    description: "Each verse a sense line at a time: listen and repeat, fill in the blank, say it with hints, type it by first letter, say it from memory.",
    estimateSecondsPerVerse: 135,
    understandStageEnabled: false,
    visualizeStageEnabled: false,
    writeFirstLetterStageEnabled: false,
  },
  {
    level: 2,
    label: "+ Visualize",
    description: "Adds a Loci/Peg + Who/Action/scene step at the start of the day.",
    estimateSecondsPerVerse: 210,
    understandStageEnabled: false,
    visualizeStageEnabled: true,
    writeFirstLetterStageEnabled: false,
  },
  {
    level: 3,
    label: "+ Write First Letter",
    description: "Adds a handwriting-recognition canvas for each word's first letter, once the verse's lines are learned.",
    estimateSecondsPerVerse: 300,
    understandStageEnabled: false,
    visualizeStageEnabled: true,
    writeFirstLetterStageEnabled: true,
  },
  {
    level: 4,
    label: "+ Understand",
    description: "Adds a clause-tagging step at the start of the day — the strongest encoding.",
    estimateSecondsPerVerse: 390,
    understandStageEnabled: true,
    visualizeStageEnabled: true,
    writeFirstLetterStageEnabled: true,
  },
];

export function formatIntensityEstimate(secondsPerVerse: number): string {
  if (secondsPerVerse < 60) return `~${secondsPerVerse}s / verse`;
  const minutes = Math.round((secondsPerVerse / 60) * 10) / 10;
  return `~${minutes} min / verse`;
}

// Level 1's 135s/verse floor, then each optional stage's own share (the gaps between the levels
// above). Built up this way rather than read off the table because a reader's own stages
// (Customize Stages) needn't match any one level — DayPathDiagram.tsx's lesson estimate needs any mix.
const BASE_SECONDS_PER_VERSE = 135;
const VISUALIZE_SECONDS_PER_VERSE = 75;
const WRITE_FIRST_LETTER_SECONDS_PER_VERSE = 90;
const UNDERSTAND_SECONDS_PER_VERSE = 90;

export function estimateLessonSeconds(verseCount: number, stages: LearnIntensityStages): number {
  let perVerse = BASE_SECONDS_PER_VERSE;
  if (stages.visualizeStageEnabled) perVerse += VISUALIZE_SECONDS_PER_VERSE;
  if (stages.writeFirstLetterStageEnabled) perVerse += WRITE_FIRST_LETTER_SECONDS_PER_VERSE;
  if (stages.understandStageEnabled) perVerse += UNDERSTAND_SECONDS_PER_VERSE;
  return perVerse * verseCount;
}

export function formatLessonDuration(totalSeconds: number): string {
  const minutes = Math.round(totalSeconds / 60);
  return minutes <= 0 ? "<1 min" : `${minutes} min${minutes === 1 ? "" : "s"}`;
}
