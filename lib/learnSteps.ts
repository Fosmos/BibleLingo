import type { Phase } from "@/components/gamification/LearnPhaseContent";

// verseIndex is undefined for the whole-day phases (orientation, orientation summary, pray);
// set for a single verse's own stages, including speak_verse's own (see buildSteps) — that
// phase is intercepted before LearnSection.tsx's own flat-step machinery even matters.
//
// cumulativeVerseIndices is set only on type_cumulative_today steps — the explicit list of
// day.newVerses indices that step combines, rather than deriving it from verseIndex's own
// position in the array. Explicit because a 6+ verse day splits into two halves (see
// buildSteps), each with its OWN progressively-growing cumulative check scoped to just that
// half — position-in-array alone can no longer say which verses a given check should cover.
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

// Every verse's own last sub-stage is followed right
// away by speak_verse: that one verse, just learned, spoken aloud from memory on its own.
// From the SECOND real verse of its own group on, speak_verse is followed by one more check —
// type_cumulative_today: every real verse learned TODAY so far IN THIS GROUP, this one
// included — plus the one verse just before the group (see PRIOR_VERSE_INDEX below) — typed by
// first letter (see ReviewChain in LearnSection.tsx's render). Only a group with no verse before
// it at all skips its first verse's check, which would just repeat speak_verse. This is deliberately scoped to just today's own verses, not
// everything ever learned (that's ReviewSection's job, in its own separate Previous Verses/
// Chapter Review stages) — so it reads as "did today's lesson actually stick together," not a
// second copy of the bigger review.
//
// `verseIndices` is which of day.newVerses actually have something to drill — a translation's
// own gap verse (see lib/bibleProviders/esv.ts's note on Mark 11:26 and its siblings) rides
// along in day.newVerses for day-ownership/reading-view purposes (see
// lib/chapterChunking.ts), but never earns its own Rhythm/Write First Letter/Speak/Type
// stages here: there's nothing there to drill, and giving it its own quick-flashing stages
// anyway just reads as the lesson glitching.
//
// A heavy day (6+ real verses) splits into two halves, each running the normal verse-by-verse
// sequence above independently — the SECOND half's own cumulative checks start fresh (scoped
// to just its own half, not carrying half one along), the same "not too much to hold at once"
// idea a single normal-sized day's own per-verse progression already follows one level down.
// Once both halves finish, one dedicated combine stage — type first letters of EVERY real
// verse learned today, both halves together — runs once, right before Pray, so the day still
// closes on "does it all fit together," just deferred to a single final stage instead of
// happening automatically as a side effect of one long unbroken sequence. A day under the
// split threshold never sees this: its own last verse's normal cumulative check already
// covers everything today by construction, same as before.
const SPLIT_THRESHOLD = 6;

// Every cumulative check also starts one verse early — the verse just before its group, so each
// check joins today's verses onto what came before: for the first group, the verse just before
// today's lesson (PRIOR_VERSE_INDEX, when it's one already learned — see LearnSection.tsx); for
// a split day's second half, the first half's last verse. With that verse in front, even a
// group's first verse, or a one-verse lesson, gets a check of its own.
export const PRIOR_VERSE_INDEX = -1;

function buildGroupSteps(group: number[], phases: Phase[], priorIndex: number | undefined): FlatStep[] {
  const steps: FlatStep[] = [];
  const lead = priorIndex === undefined ? [] : [priorIndex];
  group.forEach((verseIndex, position) => {
    for (const phase of phases) steps.push({ phase, verseIndex });
    steps.push({ phase: "speak_verse", verseIndex });
    const cumulative = [...lead, ...group.slice(0, position + 1)];
    if (cumulative.length > 1) steps.push({ phase: "type_cumulative_today", cumulativeVerseIndices: cumulative });
  });
  return steps;
}

export function buildSteps(
  verseIndices: number[],
  understandEnabled: boolean,
  visualizeEnabled: boolean,
  writeFirstLetterEnabled: boolean,
  fillInTheBlankEnabled: boolean,
  kineticTextEnabled: boolean,
  rhythmEnabled: boolean,
  // The verse just before today's lesson is one already learned (PRIOR_VERSE_INDEX's verse).
  hasPriorVerse: boolean,
): FlatStep[] {
  const steps: FlatStep[] = [];
  const prior = hasPriorVerse ? PRIOR_VERSE_INDEX : undefined;
  if (understandEnabled) steps.push({ phase: "orientation" });
  if (visualizeEnabled) steps.push({ phase: "orientation_summary" });
  const phases = versePhases(kineticTextEnabled, rhythmEnabled, writeFirstLetterEnabled, fillInTheBlankEnabled);

  if (verseIndices.length >= SPLIT_THRESHOLD) {
    const midpoint = Math.ceil(verseIndices.length / 2);
    steps.push(...buildGroupSteps(verseIndices.slice(0, midpoint), phases, prior));
    steps.push(...buildGroupSteps(verseIndices.slice(midpoint), phases, verseIndices[midpoint - 1]));
    steps.push({ phase: "type_cumulative_today", cumulativeVerseIndices: prior === undefined ? verseIndices : [prior, ...verseIndices] });
  } else {
    steps.push(...buildGroupSteps(verseIndices, phases, prior));
  }

  steps.push({ phase: "pray" });
  return steps;
}
