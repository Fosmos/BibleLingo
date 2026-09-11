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
// verse (no repeated rounds). Listen (a per-verse pass, distinct from the whole-day one — see
// ListenVerseRep.tsx) always opens the sequence when its setting is on, same gate as the
// whole-day Listen (kineticTextEnabled). Rhythm, Write First Letter (the handwriting canvas),
// and Fill In The Blank each drop out entirely when their own setting is off — Rhythm defaults
// off now that Listen is the default introduction to a fresh verse; a reader who wants that
// per-verse tap-through pacing too opts back into it. Fill In The Blank, when on, sits after
// the Speak hint and before the fully-blind Type stage — one more rung on the same
// "progressively less scaffolding" ladder: hear it (Listen) → read it (Rhythm, if on) → hear a
// first-letter hint while speaking it (Speak hint) → recall whole words with a word bank to
// lean on (Fill In The Blank) → recall it with no help at all (Type it by first letter).
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
  phases.push("speak_hint");
  if (fillInTheBlankEnabled) phases.push("fill_in_the_blank");
  phases.push("type_first_letters");
  return phases;
}

// Every verse's own type_first_letters — the last of its own sub-stages — is followed right
// away by speak_verse: that one verse, just learned, spoken aloud from memory on its own.
// From the SECOND real verse of its own group on, speak_verse is followed by one more check —
// type_cumulative_today: every real verse learned TODAY so far IN THIS GROUP, this one
// included, typed by first letter (see ReviewChain in LearnSection.tsx's render). The first
// real verse of a group skips it: with only itself learned so far, that check would just
// repeat the single verse speak_verse already covered — which is also why a one-verse group
// never gets one at all. This is deliberately scoped to just today's own verses, not
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

function buildGroupSteps(group: number[], phases: Phase[]): FlatStep[] {
  const steps: FlatStep[] = [];
  group.forEach((verseIndex, position) => {
    for (const phase of phases) steps.push({ phase, verseIndex });
    steps.push({ phase: "speak_verse", verseIndex });
    if (position > 0) {
      steps.push({ phase: "type_cumulative_today", cumulativeVerseIndices: group.slice(0, position + 1) });
    }
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
): FlatStep[] {
  const steps: FlatStep[] = [];
  if (understandEnabled) steps.push({ phase: "orientation" });
  if (visualizeEnabled) steps.push({ phase: "orientation_summary" });
  if (kineticTextEnabled) steps.push({ phase: "kinetic_text" });
  const phases = versePhases(kineticTextEnabled, rhythmEnabled, writeFirstLetterEnabled, fillInTheBlankEnabled);

  if (verseIndices.length >= SPLIT_THRESHOLD) {
    const midpoint = Math.ceil(verseIndices.length / 2);
    steps.push(...buildGroupSteps(verseIndices.slice(0, midpoint), phases));
    steps.push(...buildGroupSteps(verseIndices.slice(midpoint), phases));
    steps.push({ phase: "type_cumulative_today", cumulativeVerseIndices: verseIndices });
  } else {
    steps.push(...buildGroupSteps(verseIndices, phases));
  }

  steps.push({ phase: "pray" });
  return steps;
}
