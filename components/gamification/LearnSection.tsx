"use client";

import { useMemo, useState } from "react";
import type { MemorizationDay, VerseSegment } from "@/types";
import { getAdjacentVerse } from "@/lib/chapterContent";
import { joinVerses, verseNumberMarkers } from "@/lib/verseBatching";
import { tokenizeVerseWords } from "@/lib/verseWords";
import { useCheckpointField } from "@/lib/useSessionCheckpoint";
import { useProgressStore } from "@/store/useProgressStore";
import { useCelebration } from "@/lib/useCelebration";
import { sliceWordAnnotations, type WordAnnotationMap } from "@/lib/verseHighlights";
import { LearnPhaseContent, type Phase } from "@/components/gamification/LearnPhaseContent";
import { ReviewChain } from "@/components/drills/ReviewChain";
import { SpeakRep } from "@/components/drills/SpeakRep";
import { SectionCompleteOverlay } from "@/components/ui/SectionCompleteOverlay";

interface LearnSectionProps {
  day: MemorizationDay;
  onComplete: () => void;
  sessionKey?: string;
}

// A heavier day's worth of new verses gets a longer prayer timer — see PrayRep.tsx's own
// default (30s) for everything at or under this threshold.
const PRAY_LONGER_VERSE_THRESHOLD = 3;
const LONGER_PRAYER_DURATION_S = 60;

// verseIndex is undefined for the whole-day phases (orientation, orientation summary, pray);
// set for a single verse's own stages, including speak_verse's own (see buildSteps) — that
// phase is intercepted before this flat-step machinery even matters, see the render below.
type FlatStep = { phase: Phase; verseIndex?: number };

// One individual verse's own drilling stages — run once, in order, before moving to the next
// verse (no repeated rounds). Write First Letter (the handwriting canvas) and Fill In The
// Blank each drop out entirely when their own setting is off. Fill In The Blank, when on,
// sits after the Speak hint and before the fully-blind Type stage — one more rung on the
// same "progressively less scaffolding" ladder: read it (Rhythm) → hear a first-letter hint
// while speaking it (Speak hint) → recall whole words with a word bank to lean on (Fill In
// The Blank) → recall it with no help at all (Type it by first letter).
function versePhases(writeFirstLetterEnabled: boolean, fillInTheBlankEnabled: boolean): Phase[] {
  const phases: Phase[] = ["rhythm"];
  if (writeFirstLetterEnabled) phases.push("draw_first_letters");
  phases.push("speak_hint");
  if (fillInTheBlankEnabled) phases.push("fill_in_the_blank");
  phases.push("type_first_letters");
  return phases;
}

// Phases with no room/relevance for prev/next-verse context: draw is full-viewport.
const CONTEXT_LESS_PHASES: Phase[] = ["draw_first_letters"];

// Every verse's own type_first_letters — the last of its own sub-stages — is followed right
// away by speak_verse: that one verse, just learned, spoken aloud from memory on its own.
// From the SECOND verse of the day on, speak_verse is followed by one more check —
// type_cumulative_today: every verse learned TODAY so far, this one included, typed by
// first letter (see ReviewChain in the render below). The first verse skips it: with only
// itself learned so far today, that check would just repeat the single verse speak_verse
// already covered — which is also why a one-verse day never gets one at all. This is
// deliberately scoped to just today's own verses, not everything ever learned (that's
// ReviewSection's job, in its own separate Previous Verses/Chapter Review stages) — so it
// reads as "did today's lesson actually stick together," not a second copy of the bigger
// review. Pray always runs dead last, right before the lesson hands off to whatever review
// follows it (Chapter Review, etc.) — a closing moment, not a mid-lesson one.
function buildSteps(
  verseCount: number,
  understandEnabled: boolean,
  visualizeEnabled: boolean,
  writeFirstLetterEnabled: boolean,
  fillInTheBlankEnabled: boolean,
): FlatStep[] {
  const steps: FlatStep[] = [];
  if (understandEnabled) steps.push({ phase: "orientation" });
  if (visualizeEnabled) steps.push({ phase: "orientation_summary" });
  const phases = versePhases(writeFirstLetterEnabled, fillInTheBlankEnabled);
  for (let verseIndex = 0; verseIndex < verseCount; verseIndex++) {
    for (const phase of phases) steps.push({ phase, verseIndex });
    steps.push({ phase: "speak_verse", verseIndex });
    if (verseIndex > 0) steps.push({ phase: "type_cumulative_today", verseIndex });
  }
  steps.push({ phase: "pray" });
  return steps;
}

function noopAnnotationsChange() {
  // Only the orientation phase ever calls this — every other phase gets this no-op.
}

// A day's new verses go through Orientation (highlight/annotate + 3-word summary) ONCE across
// every verse selected today. Then each verse, one at a time, runs Rhythm → Write First
// Letter → Speak (first-letter hint) → Type it by first letter → speak that one verse aloud
// from memory → (every verse but the first) type every verse learned today so far by first
// letter, growing verse by verse — before moving to the next verse. One prayer timer closes
// the lesson out, dead last — right before whatever review follows (Chapter Review, etc.),
// not mid-lesson.
export function LearnSection({ day, onComplete, sessionKey }: LearnSectionProps) {
  const wholeDay = useMemo(() => joinVerses(day.newVerses, "day"), [day.newVerses]);
  // Word offset of each verse's own first word within the whole-day joined text — lets a
  // verse's stages read the slice of wordAnnotations (made once, during Orientation, against
  // the whole-day text) relevant to just its own words.
  const verseOffsets = useMemo(() => {
    const offsets: number[] = [];
    let total = 0;
    for (const verse of day.newVerses) {
      offsets.push(total);
      total += tokenizeVerseWords(verse.text).length;
    }
    return offsets;
  }, [day.newVerses]);
  const understandStageEnabled = useProgressStore((state) => state.understandStageEnabled);
  const visualizeStageEnabled = useProgressStore((state) => state.visualizeStageEnabled);
  const writeFirstLetterStageEnabled = useProgressStore((state) => state.writeFirstLetterStageEnabled);
  const fillInTheBlankStageEnabled = useProgressStore((state) => state.fillInTheBlankStageEnabled);
  const steps = useMemo(
    () => buildSteps(day.newVerses.length, understandStageEnabled, visualizeStageEnabled, writeFirstLetterStageEnabled, fillInTheBlankStageEnabled),
    [day.newVerses.length, understandStageEnabled, visualizeStageEnabled, writeFirstLetterStageEnabled, fillInTheBlankStageEnabled],
  );

  const [stepIndex, setStepIndex] = useCheckpointField(sessionKey, "learnStepIndex", 0);
  const [wordAnnotations, setWordAnnotations] = useState<WordAnnotationMap>({});
  const { pending, celebrate, finish } = useCelebration();

  if (pending) {
    return <SectionCompleteOverlay text={pending.text} onDone={finish} />;
  }

  const step = steps[stepIndex];
  if (!step) return null;

  function advance() {
    const next = stepIndex + 1;
    if (next >= steps.length) {
      celebrate(onComplete, "New Verses Learned");
    } else {
      celebrate(() => setStepIndex(next));
    }
  }

  if (step.phase === "speak_verse") {
    // Just the one verse this stage follows — spoken aloud from memory on its own, not
    // folded into everything learned so far (that's ReviewSection's job, not this one's).
    // Same mechanic (and component) ChapterReviewStage's own "Recite it all" stage uses.
    // firstLettersOnMistake keeps a miss from just handing back the answer it's testing — a
    // first-letter hint instead.
    const verseForStage = day.newVerses[step.verseIndex ?? day.newVerses.length - 1];
    return (
      <div className="flex flex-col gap-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
          Stage {stepIndex + 1} of {steps.length}
        </p>
        <SpeakRep
          label="Remember"
          reference={verseForStage.reference}
          targetText={verseForStage.text}
          reps={1}
          firstLettersOnMistake
          onComplete={() => advance()}
        />
      </div>
    );
  }

  if (step.phase === "type_cumulative_today") {
    // Every verse learned TODAY so far, this one included — never day.reviewVerses (prior
    // days' own verses), which is ReviewSection's job, not this one's.
    const versesLearnedTodaySoFar = day.newVerses.slice(0, (step.verseIndex ?? 0) + 1);
    return (
      <div className="flex flex-col gap-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
          Stage {stepIndex + 1} of {steps.length}
        </p>
        <ReviewChain verses={versesLearnedTodaySoFar} label="Remember" onComplete={() => advance()} />
      </div>
    );
  }

  const wholeDayPhase = step.verseIndex === undefined;
  const verse = wholeDayPhase ? wholeDay : day.newVerses[step.verseIndex!];
  const boundaryVerses = wholeDayPhase ? day.newVerses : [verse];
  const annotations = wholeDayPhase
    ? wordAnnotations
    : sliceWordAnnotations(wordAnnotations, verseOffsets[step.verseIndex!], tokenizeVerseWords(verse.text).length);
  const verseMarkers = wholeDayPhase ? verseNumberMarkers(day.newVerses) : {};

  const showContext = !CONTEXT_LESS_PHASES.includes(step.phase);
  const firstVerse = boundaryVerses[0];
  const lastVerse = boundaryVerses[boundaryVerses.length - 1];
  const previousVerse: VerseSegment | undefined = showContext
    ? getAdjacentVerse(firstVerse.book, firstVerse.chapter, firstVerse.verseNumber, -1)
    : undefined;
  const nextVerse: VerseSegment | undefined = showContext
    ? getAdjacentVerse(lastVerse.book, lastVerse.chapter, lastVerse.verseNumber, 1)
    : undefined;

  const stageKey = `${step.phase}-${step.verseIndex ?? "day"}`;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
        Stage {stepIndex + 1} of {steps.length}
      </p>
      <LearnPhaseContent
        phase={step.phase}
        stageKey={stageKey}
        verse={verse}
        speakLabel="Remember"
        verseMarkers={verseMarkers}
        wordAnnotations={annotations}
        onWordAnnotationsChange={step.phase === "orientation" ? setWordAnnotations : noopAnnotationsChange}
        previousVerse={previousVerse}
        nextVerse={nextVerse}
        prayDurationSeconds={day.newVerses.length > PRAY_LONGER_VERSE_THRESHOLD ? LONGER_PRAYER_DURATION_S : undefined}
        onAdvance={advance}
      />
    </div>
  );
}
