import type { VerseSegment } from "@/types";
import type { WordAnnotationMap } from "@/lib/verseHighlights";
import type { ChapterReadingLayout } from "@/lib/useChapterReadingLayout";
import { VerseOrientationRep } from "@/components/drills/VerseOrientationRep";
import { VerseOrientationSummaryRep } from "@/components/drills/VerseOrientationSummaryRep";
import { PrayRep } from "@/components/drills/PrayRep";

interface LearnWholeDayPhaseContentProps {
  phase: "orientation" | "orientation_summary" | "pray";
  stageKey: string;
  // The single joined "whole day" VerseSegment (see LearnSection.tsx's own `wholeDay`) —
  // Understand's own clause-splitting math (breakAfter, blocks, role annotations) stays keyed
  // to this COMBINED word-index space, since a clause can cross a real verse boundary; every
  // phase here (Understand included) renders via `verses`/`verseOffsets` below, each real
  // verse on its own real reading-view page position.
  verse: VerseSegment;
  verseMarkers: Record<number, number>;
  // Today's own real verses (see LearnSection.tsx's `realVerses`) plus each one's own word
  // offset into `wordAnnotations`' whole-day indexing (see LearnSection.tsx's `verseOffsets`).
  verses: VerseSegment[];
  verseOffsets: number[];
  wordAnnotations: WordAnnotationMap;
  onWordAnnotationsChange: (updater: (prev: WordAnnotationMap) => WordAnnotationMap) => void;
  prayDurationSeconds?: number;
  layout: ChapterReadingLayout;
  onAdvance: () => void;
}

// The three whole-day phases — split out of LearnPhaseContent.tsx purely to keep that file
// under this codebase's 200-line cap.
export function LearnWholeDayPhaseContent({
  phase,
  stageKey,
  verse,
  verseMarkers,
  verses,
  verseOffsets,
  wordAnnotations,
  onWordAnnotationsChange,
  prayDurationSeconds,
  layout,
  onAdvance,
}: LearnWholeDayPhaseContentProps) {
  if (phase === "orientation") {
    return (
      <VerseOrientationRep
        key={stageKey}
        verse={verse}
        verseMarkers={verseMarkers}
        annotations={wordAnnotations}
        onAnnotationsChange={onWordAnnotationsChange}
        onComplete={onAdvance}
        verses={verses}
        verseOffsets={verseOffsets}
        layout={layout}
      />
    );
  }

  if (phase === "orientation_summary") {
    return (
      <VerseOrientationSummaryRep
        key={stageKey}
        verses={verses}
        verseOffsets={verseOffsets}
        wordAnnotations={wordAnnotations}
        onComplete={onAdvance}
        layout={layout}
      />
    );
  }

  return (
    <PrayRep
      key={stageKey}
      verses={verses}
      verseOffsets={verseOffsets}
      wordAnnotations={wordAnnotations}
      onComplete={onAdvance}
      durationSeconds={prayDurationSeconds}
      layout={layout}
    />
  );
}
