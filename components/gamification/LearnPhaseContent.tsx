"use client";

import type { ReactNode } from "react";
import type { VerseSegment } from "@/types";
import { firstLetterHintTokens } from "@/lib/verseFirstLetters";
import type { WordAnnotationMap } from "@/lib/verseHighlights";
import type { ChapterReadingLayout } from "@/lib/useChapterReadingLayout";
import { useProgressStore } from "@/store/useProgressStore";
import { verseKey } from "@/lib/verseKey";
import { locationTagKey } from "@/lib/locationTags";
import { ListenVerseRep } from "@/components/drills/ListenVerseRep";
import { RhythmRep } from "@/components/drills/RhythmRep";
import { DrawFirstLetterRep } from "@/components/drills/DrawFirstLetterRep";
import { FillInTheBlankRep } from "@/components/drills/FillInTheBlankRep";
import { FirstLetterTypeRep } from "@/components/drills/FirstLetterTypeRep";
import { SpeakRep } from "@/components/drills/SpeakRep";
import { LearnWholeDayPhaseContent } from "@/components/gamification/LearnWholeDayPhaseContent";
import { VerseVisualBadge } from "@/components/ui/VerseVisualBadge";

export type Phase =
  | "orientation"
  | "orientation_summary"
  | "kinetic_text"
  | "listen_verse"
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
  // Today's own real verses (see LearnSection.tsx's `realVerses`) plus each one's own word
  // offset into `wordAnnotations`' whole-day indexing (see LearnSection.tsx's `verseOffsets`,
  // realigned to `verses`' own indices). Only read by the whole-day phases below — see
  // LearnWholeDayPhaseContent.tsx.
  verses: VerseSegment[];
  verseOffsets: number[];
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
  // The fixed "page" of surrounding verses `verse` renders inside of when SpeakRep has no
  // `layout` (see SpeakRep.tsx's own `hasContext`) — undefined for whole-day phases, which use
  // previousVerse/nextVerse instead.
  contextVerses?: VerseSegment[];
  previousVerse?: VerseSegment;
  nextVerse?: VerseSegment;
  // Only read by the "pray" phase — see PrayRep.tsx and LearnSection.tsx's buildSteps.
  prayDurationSeconds?: number;
  // The reading view's own real page layout (see lib/useChapterReadingLayout.ts) — passed
  // through to whichever per-verse stages already render against it (see each drill's own
  // `layout` prop) so their own parchment matches the Path screen's reading view exactly,
  // instead of a smaller/differently-sized excerpt. Stages not yet converted just ignore it.
  layout: ChapterReadingLayout;
  onAdvance: () => void;
}

// Split out of LearnSection so that component can stay focused on the day's batch/phase
// orchestration — this just maps the current phase to its drill + reveal-help pairing.
export function LearnPhaseContent({
  phase,
  stageKey,
  verse,
  verses,
  verseOffsets,
  speakLabel,
  verseMarkers,
  wordAnnotations,
  onWordAnnotationsChange,
  contextVerses,
  previousVerse,
  nextVerse,
  prayDurationSeconds,
  layout,
  onAdvance,
}: LearnPhaseContentProps) {
  // Read unconditionally regardless of phase — a whole-day phase's `verse` stands in for the
  // whole day (see LearnSection.tsx) but keeps the first new verse's own identity, a
  // reasonable single anchor for a combined screen.
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

  if (phase === "orientation" || phase === "orientation_summary" || phase === "kinetic_text" || phase === "pray") {
    content = (
      <LearnWholeDayPhaseContent
        phase={phase}
        stageKey={stageKey}
        verse={verse}
        verseMarkers={verseMarkers}
        verses={verses}
        verseOffsets={verseOffsets}
        wordAnnotations={wordAnnotations}
        onWordAnnotationsChange={onWordAnnotationsChange}
        prayDurationSeconds={prayDurationSeconds}
        layout={layout}
        onAdvance={onAdvance}
      />
    );
  } else if (phase === "listen_verse") {
    content = <ListenVerseRep key={stageKey} verse={verse} layout={layout} onComplete={onAdvance} />;
  } else if (phase === "rhythm") {
    content = (
      <RhythmRep
        key={stageKey}
        verse={verse}
        verseMarkers={verseMarkers}
        annotations={wordAnnotations}
        layout={layout}
        onComplete={onAdvance}
      />
    );
  } else if (phase === "draw_first_letters") {
    content = <DrawFirstLetterRep key={stageKey} verse={verse} verseMarkers={verseMarkers} annotations={wordAnnotations} layout={layout} onComplete={onAdvance} />;
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
        verse={verse}
        contextVerses={contextVerses}
        layout={layout}
        onComplete={onAdvance}
      />
    );
  } else if (phase === "fill_in_the_blank") {
    content = <FillInTheBlankRep key={stageKey} verse={verse} layout={layout} onComplete={onAdvance} />;
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
        contextVerses={contextVerses}
        layout={layout}
        onComplete={() => onAdvance()}
      />
    );
  } else {
    // speak_verse/type_cumulative_today never reach here — LearnSection.tsx intercepts both
    // itself before rendering this component at all (see its own SpeakRep/ReviewChain use).
    content = null;
  }

  return (
    <>
      {visualBadge}
      {content}
    </>
  );
}
