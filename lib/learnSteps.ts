import type { Phase } from "@/components/gamification/LearnPhaseContent";
import { sayLadder, type LineMode } from "@/lib/sayLadder";

// verseIndex is undefined for the whole-day phases (orientation, orientation summary, pray);
// set for a single verse's own stages, including speak_verse's own (see buildSteps) — that
// phase is intercepted before LearnSection.tsx's own flat-step machinery even matters.
//
// lines is set on a verse's sense-line stages: the first and last of its sense lines (0-based,
// inclusive) the stage drills (lib/senseLineSlice.ts). Unset, a stage drills the whole verse.
//
// cumulativeVerseIndices is set only on type_cumulative_today steps — the explicit list of
// day.newVerses indices that check covers.
//
// lineModes is set on say_ladder steps — how each of the verse's sense lines shows (lib/sayLadder.ts).
export interface FlatStep {
  phase: Phase;
  verseIndex?: number;
  lines?: [number, number];
  lineModes?: LineMode[];
  cumulativeVerseIndices?: number[];
}

// The optional stages (Profile > Advanced, and the Learn intensity picker's presets).
export interface LearnStageOptions {
  understand: boolean;
  visualize: boolean;
  rhythm: boolean;
  writeFirstLetter: boolean;
  // Last letters (UserProgress.lastLettersStageEnabled), and Pray (UserProgress.prayStageEnabled).
  lastLetters: boolean;
  pray: boolean;
  // The end-of-verse challenges (UserProgress.timedTypeStageEnabled/payloadStageEnabled/
  // mathBreakStageEnabled).
  timedType: boolean;
  payload: boolean;
  mathBreaks: boolean;
  // Learn each verse whole rather than a sense line at a time (UserProgress.wholeVerseLearning).
  wholeVerse?: boolean;
  // The say-it ladder in place of the stages above (UserProgress.sayLadderLearning — on unless turned off).
  sayLadder?: boolean;
}

// Phases with no room/relevance for prev/next-verse context: draw is full-viewport.
export const CONTEXT_LESS_PHASES: Phase[] = ["draw_first_letters"];

// One verse learned sense line by sense line. For each line in turn: hear it and say it back
// (Listen & Repeat), tap every one of its words back in from a bank (Fill in the blank, all
// blank), say it with first-letter hints — then type the
// first letters of every line so far with only their last letters showing (optional), then with
// nothing showing, and say every line so far from memory. So the verse builds up a line at a
// time, each new line recalled together with the lines before it.
function senseLineSteps(verseIndex: number, lineCount: number, options: LearnStageOptions): FlatStep[] {
  const steps: FlatStep[] = [];
  for (let line = 0; line < lineCount; line++) {
    steps.push({ phase: "listen_verse", verseIndex, lines: [line, line] });
    steps.push({ phase: "fill_in_the_blank", verseIndex, lines: [line, line] });
    steps.push({ phase: "speak_hint", verseIndex, lines: [line, line] });
    if (options.lastLetters) steps.push({ phase: "type_from_last_letters", verseIndex, lines: [0, line] });
    steps.push({ phase: "fill_in_the_blank_letters", verseIndex, lines: [0, line] });
    steps.push({ phase: "speak_verse", verseIndex, lines: [0, line] });
  }
  return steps;
}

// The same stages run once over the whole verse — the way verses were learned before sense lines.
function wholeVerseSteps(verseIndex: number, options: LearnStageOptions): FlatStep[] {
  const phases: Phase[] = ["listen_verse", "fill_in_the_blank", "speak_hint"];
  if (options.lastLetters) phases.push("type_from_last_letters");
  phases.push("fill_in_the_blank_letters", "speak_verse");
  return phases.map((phase) => ({ phase, verseIndex }));
}

// Once a verse is learned, the optional challenges over the whole of it, in this order: type it
// by first letter against the clock; say it from memory holding a number and color in mind; and
// type it by first letter with a math problem after each sense line.
function challengeSteps(verseIndex: number, options: LearnStageOptions): FlatStep[] {
  const phases: Phase[] = [];
  if (options.timedType) phases.push("type_timed");
  if (options.payload) phases.push("speak_payload");
  if (options.mathBreaks) phases.push("type_math");
  return phases.map((phase) => ({ phase, verseIndex }));
}

// A Learn lesson: the optional whole-lesson stages (Understand, Visualize), then each verse — its
// optional Rhythm read-through, its say-it ladder (lib/sayLadder.ts — read it aloud, then say it as
// its lines turn to first letters and then to blanks, one at a time; or, with that setting off, its
// sense-line stages above, or with the whole-verse option its stages over the whole verse), its optional challenges (above), then its optional Write First Letter — a typing check of all of
// today's verses together when there are several, and the optional Pray.
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
    const lineCount = Math.max(1, lineCounts[position] ?? 1);
    if (options.sayLadder) steps.push(...sayLadder(lineCount).map((lineModes) => ({ phase: "say_ladder" as const, verseIndex, lineModes })));
    else steps.push(...(options.wholeVerse ? wholeVerseSteps(verseIndex, options) : senseLineSteps(verseIndex, lineCount, options)));
    steps.push(...challengeSteps(verseIndex, options));
    if (options.writeFirstLetter) steps.push({ phase: "draw_first_letters", verseIndex });
  });
  if (verseIndices.length > 1) steps.push({ phase: "type_cumulative_today", cumulativeVerseIndices: verseIndices });
  if (options.pray) steps.push({ phase: "pray" });
  return steps;
}
