import type { Phase } from "@/components/gamification/LearnPhaseContent";

// verseIndex is undefined for the whole-day phases (orientation, orientation summary, pray);
// set for a single verse's own stages, including speak_verse's own (see buildSteps) — that
// phase is intercepted before LearnSection.tsx's own flat-step machinery even matters.
//
// cumulativeVerseIndices is set only on type_cumulative_today steps — the explicit list of
// day.newVerses indices that check covers.
export interface FlatStep {
  phase: Phase;
  verseIndex?: number;
  cumulativeVerseIndices?: number[];
}

// Phases with no room/relevance for prev/next-verse context: draw is full-viewport.
export const CONTEXT_LESS_PHASES: Phase[] = ["draw_first_letters"];

// One individual verse's own drilling stages — run once, in order, before moving to the next
// verse (no repeated rounds). Listen (see ListenVerseRep.tsx — this ONE verse narrated aloud)
// always opens the sequence when its setting (kineticTextEnabled) is on. Rhythm, Write First
// Letter (the handwriting canvas),
// and the word-bank Fill In The Blank each drop out entirely when their own setting is off — Rhythm
// defaults off now that Listen is the default introduction to a fresh verse; a reader who wants
// that per-verse tap-through pacing too opts back into it. The ladder runs from most scaffolding
// to least: hear it (Listen) → read it (Rhythm, if on) → recall whole words with a word bank to
// lean on (Fill In The Blank) → speak it with a first-letter hint (Speak hint) → recall words by
// typing just their first letter (Fill In The Blank, first letter). That last one always runs —
// it replaced the old separate "type it by first letter" stage, whose recall its own second rep
// (every word blanked) already covers.
function versePhases(
  kineticTextEnabled: boolean,
  rhythmEnabled: boolean,
  writeFirstLetterEnabled: boolean,
  fillInTheBlankEnabled: boolean,
): Phase[] {
  const phases: Phase[] = [];
  if (kineticTextEnabled) phases.push("listen_verse");
  if (rhythmEnabled) phases.push("rhythm");
  if (writeFirstLetterEnabled) phases.push("draw_first_letters");
  if (fillInTheBlankEnabled) phases.push("fill_in_the_blank");
  phases.push("speak_hint");
  phases.push("fill_in_the_blank_letters");
  return phases;
}

// Each verse's stages, closed by speak_verse: that verse spoken from memory. A lesson of several
// verses then types them all together once before Pray (ReviewChain in LearnCumulativeStage.tsx).
// The pericope's earlier verses are reviewed before all this (VerseLessonFlow.tsx).
//
// `verseIndices` is which of day.newVerses actually have something to drill — a translation's
// own gap verse (see lib/bibleProviders/esv.ts's note on Mark 11:26 and its siblings) rides
// along in day.newVerses for day-ownership/reading-view purposes (see lib/chapterChunking.ts),
// but never earns its own stages here: there's nothing there to drill.

export function buildSteps(
  verseIndices: number[],
  understandEnabled: boolean,
  visualizeEnabled: boolean,
  writeFirstLetterEnabled: boolean,
  fillInTheBlankEnabled: boolean,
  kineticTextEnabled: boolean,
  rhythmEnabled: boolean,
): FlatStep[] {
  const steps: FlatStep[] = [];
  if (understandEnabled) steps.push({ phase: "orientation" });
  if (visualizeEnabled) steps.push({ phase: "orientation_summary" });
  const phases = versePhases(kineticTextEnabled, rhythmEnabled, writeFirstLetterEnabled, fillInTheBlankEnabled);
  for (const verseIndex of verseIndices) {
    for (const phase of phases) steps.push({ phase, verseIndex });
    steps.push({ phase: "speak_verse", verseIndex });
  }
  if (verseIndices.length > 1) steps.push({ phase: "type_cumulative_today", cumulativeVerseIndices: verseIndices });
  steps.push({ phase: "pray" });
  return steps;
}
