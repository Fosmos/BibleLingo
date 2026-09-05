"use client";

import type { ReactNode } from "react";
import type { VerseSegment } from "@/types";
import { firstLetterHintTokens } from "@/lib/verseFirstLetters";
import type { WordAnnotationMap } from "@/lib/verseHighlights";
import { useProgressStore } from "@/store/useProgressStore";
import { verseKey } from "@/lib/verseKey";
import { locationTagKey } from "@/lib/locationTags";
import { VerseOrientationRep } from "@/components/drills/VerseOrientationRep";
import { VerseOrientationSummaryRep } from "@/components/drills/VerseOrientationSummaryRep";
import { RhythmRep } from "@/components/drills/RhythmRep";
import { DrawFirstLetterRep } from "@/components/drills/DrawFirstLetterRep";
import { FillInTheBlankRep } from "@/components/drills/FillInTheBlankRep";
import { FirstLetterTypeRep } from "@/components/drills/FirstLetterTypeRep";
import { SpeakRep } from "@/components/drills/SpeakRep";
import { PrayRep } from "@/components/drills/PrayRep";
import { VerseVisualBadge } from "@/components/ui/VerseVisualBadge";

export type Phase =
  | "orientation"
  | "orientation_summary"
  | "rhythm"
  | "draw_first_letters"
  | "speak_hint"
  | "fill_in_the_blank"
  | "type_first_letters"
  | "pray"
  | "speak_verse"
  | "type_cumulative_today";

interface LearnPhaseContentProps {
  phase: Phase;
  stageKey: string;
  // The text this phase drills — the whole day's verses joined for orientation/orientation_
  // summary/pray, or a single verse for rhythm/draw/speak/type/speak_verse, which run per
  // verse.
  verse: VerseSegment;
  speakLabel: string;
  // Which word index each verse after the first starts at within `verse`'s own text — an
  // inline number wherever a new verse begins in a multi-verse segment, purely presentational.
  verseMarkers: Record<number, number>;
  // Highlights/notes made in Orientation, already scoped to `verse`'s own word indices by the
  // caller. Only the orientation phase writes to these; every other phase shows them read-only.
  wordAnnotations: WordAnnotationMap;
  // Only the orientation phase actually calls this — the caller passes a no-op for every
  // other phase, since they show wordAnnotations read-only.
  onWordAnnotationsChange: (updater: (prev: WordAnnotationMap) => WordAnnotationMap) => void;
  previousVerse?: VerseSegment;
  nextVerse?: VerseSegment;
  // Only read by the "pray" phase — see PrayRep.tsx and LearnSection.tsx's buildSteps.
  prayDurationSeconds?: number;
  onAdvance: () => void;
}

// Split out of LearnSection so that component can stay focused on the day's batch/phase
// orchestration — this just maps the current phase to its drill + reveal-help pairing.
export function LearnPhaseContent({
  phase,
  stageKey,
  verse,
  speakLabel,
  verseMarkers,
  wordAnnotations,
  onWordAnnotationsChange,
  previousVerse,
  nextVerse,
  prayDurationSeconds,
  onAdvance,
}: LearnPhaseContentProps) {
  // Read unconditionally regardless of phase, since hooks can't be called conditionally. For
  // a multi-verse whole-day phase, `verse` stands in for the whole day (see LearnSection.tsx)
  // but keeps the first new verse's own identity, so this naturally resolves to that verse's
  // own tag/POA — a reasonable single anchor for a combined screen.
  const poa = useProgressStore((state) => state.versePOA[verseKey(verse.book, verse.chapter, verse.verseNumber)]);
  const locationTag = useProgressStore((state) => state.locationTags[locationTagKey({ level: "verse", book: verse.book, chapter: verse.chapter, verseNumber: verse.verseNumber })]);
  // Once the reader has visualized this lesson (i.e. every phase after orientation_summary),
  // a small badge pins their own mnemonic pieces — the location tag plus their POA — to the
  // top-right corner as a constant reminder through the rest of the flow.
  const showVisualBadge = phase !== "orientation" && phase !== "orientation_summary";
  const visualBadge =
    showVisualBadge && locationTag && poa ? (
      <VerseVisualBadge furnitureLabel={locationTag} who={poa.who} action={poa.action} additionalInfo={poa.additionalInfo} />
    ) : null;

  let content: ReactNode;

  if (phase === "orientation") {
    content = (
      <VerseOrientationRep
        key={stageKey}
        verse={verse}
        verseMarkers={verseMarkers}
        annotations={wordAnnotations}
        onAnnotationsChange={onWordAnnotationsChange}
        onComplete={onAdvance}
        previousVerse={previousVerse}
        nextVerse={nextVerse}
      />
    );
  } else if (phase === "orientation_summary") {
    content = (
      <VerseOrientationSummaryRep
        key={stageKey}
        verse={verse}
        verseMarkers={verseMarkers}
        annotations={wordAnnotations}
        onComplete={onAdvance}
        previousVerse={previousVerse}
        nextVerse={nextVerse}
      />
    );
  } else if (phase === "rhythm") {
    content = (
      <RhythmRep
        key={stageKey}
        verse={verse}
        verseMarkers={verseMarkers}
        annotations={wordAnnotations}
        previousVerse={previousVerse}
        nextVerse={nextVerse}
        onComplete={onAdvance}
      />
    );
  } else if (phase === "draw_first_letters") {
    content = <DrawFirstLetterRep key={stageKey} verse={verse} verseMarkers={verseMarkers} annotations={wordAnnotations} onComplete={onAdvance} />;
  } else if (phase === "speak_hint") {
    content = (
      <SpeakRep
        key={stageKey}
        label={speakLabel}
        reference={verse.reference}
        targetText={verse.text}
        reps={1}
        showVerse={false}
        hintTokens={firstLetterHintTokens(verse.text, verseMarkers)}
        onComplete={onAdvance}
      />
    );
  } else if (phase === "fill_in_the_blank") {
    content = <FillInTheBlankRep key={stageKey} verse={verse} onComplete={onAdvance} />;
  } else if (phase === "type_first_letters") {
    content = (
      <FirstLetterTypeRep
        key={stageKey}
        verse={verse}
        reps={1}
        verseMarkers={verseMarkers}
        annotations={wordAnnotations}
        previousVerse={previousVerse}
        nextVerse={nextVerse}
        onComplete={() => onAdvance()}
      />
    );
  } else if (phase === "pray") {
    content = (
      <PrayRep
        key={stageKey}
        verse={verse}
        verseMarkers={verseMarkers}
        annotations={wordAnnotations}
        onComplete={onAdvance}
        previousVerse={previousVerse}
        nextVerse={nextVerse}
        durationSeconds={prayDurationSeconds}
      />
    );
  } else {
    // speak_verse/type_cumulative_today never actually reach here — LearnSection.tsx
    // intercepts both itself, before rendering this component at all: speak_verse for the
    // closing speak-it-aloud stage after every verse's own sub-stages (see SpeakRep there),
    // covering just that one verse; type_cumulative_today for the typed check right after
    // it — every verse learned TODAY so far, this one included — on every verse but the
    // first (see ReviewChain there).
    content = null;
  }

  return (
    <>
      {visualBadge}
      {content}
    </>
  );
}
