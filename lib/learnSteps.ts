import type { Phase } from "@/components/gamification/LearnPhaseContent";

// verseIndex is undefined for the whole-day phases (orientation, orientation summary, pray);
// set for a single verse's own stages, including speak_verse's own (see buildSteps) — that
// phase is intercepted before LearnSection.tsx's own flat-step machinery even matters.
//
// lines is set on a verse's sense-line stages: the first and last of its sense lines (0-based,
// inclusive) the stage drills (lib/senseLineSlice.ts). Unset, a stage drills the whole verse.
//
// cumulativeVerseIndices is set only on type_cumulative_today steps — the explicit list of
// day.newVerses indices that check covers.
export interface FlatStep {
  phase: Phase;
  verseIndex?: number;
  lines?: [number, number];
  cumulativeVerseIndices?: number[];
}

// The optional stages (Profile > Advanced, and the Learn intensity picker's presets).
export interface LearnStageOptions {
  understand: boolean;
  visualize: boolean;
  rhythm: boolean;
  writeFirstLetter: boolean;
}

// Phases with no room/relevance for prev/next-verse context: draw is full-viewport.
export const CONTEXT_LESS_PHASES: Phase[] = ["draw_first_letters"];

// One verse learned sense line by sense line. For each line in turn: hear it and say it back
// (Listen & Repeat), tap every one of its words back in from a bank (Fill in the blank, all
// blank), say it with first-letter hints — then type the first letters of every line so far, and
// say every line so far from memory. So the verse builds up a line at a time, each new line
// recalled together with the lines before it.
function senseLineSteps(verseIndex: number, lineCount: number): FlatStep[] {
  const steps: FlatStep[] = [];
  for (let line = 0; line < lineCount; line++) {
    steps.push({ phase: "listen_verse", verseIndex, lines: [line, line] });
    steps.push({ phase: "fill_in_the_blank", verseIndex, lines: [line, line] });
    steps.push({ phase: "speak_hint", verseIndex, lines: [line, line] });
    steps.push({ phase: "fill_in_the_blank_letters", verseIndex, lines: [0, line] });
    steps.push({ phase: "speak_verse", verseIndex, lines: [0, line] });
  }
  return steps;
}

// A Learn lesson: the optional whole-lesson stages (Understand, Visualize), then each verse — its
// optional Rhythm read-through, its sense-line ladder (above), then its optional Write First
// Letter — a typing check of all of today's verses together when there are several, and Pray.
// The verses before it are reviewed after (VerseLessonFlow.tsx).
//
// `verseIndices` is which of day.newVerses actually have something to drill — a translation's
// own gap verse (see lib/bibleProviders/esv.ts's note on Mark 11:26 and its siblings) rides
// along in day.newVerses for day-ownership/reading-view purposes (see lib/chapterChunking.ts),
// but never earns its own stages here: there's nothing there to drill. `lineCounts` is each of
// those verses' number of sense lines, in the same order.
export function buildSteps(verseIndices: number[], lineCounts: number[], options: LearnStageOptions): FlatStep[] {
  const steps: FlatStep[] = [];
  if (options.understand) steps.push({ phase: "orientation" });
  if (options.visualize) steps.push({ phase: "orientation_summary" });
  verseIndices.forEach((verseIndex, position) => {
    if (options.rhythm) steps.push({ phase: "rhythm", verseIndex });
    steps.push(...senseLineSteps(verseIndex, Math.max(1, lineCounts[position] ?? 1)));
    if (options.writeFirstLetter) steps.push({ phase: "draw_first_letters", verseIndex });
  });
  if (verseIndices.length > 1) steps.push({ phase: "type_cumulative_today", cumulativeVerseIndices: verseIndices });
  steps.push({ phase: "pray" });
  return steps;
}
