"use client";

import type { VerseSegment } from "@/types";
import type { VerseAccuracy } from "@/lib/verseAccuracyBreakdown";
import type { ChapterReadingLayout } from "@/lib/useChapterReadingLayout";
import { joinVerses, verseNumberMarkers } from "@/lib/verseBatching";
import { useProgressStore } from "@/store/useProgressStore";
import { FirstLetterTypeRep } from "@/components/drills/FirstLetterTypeRep";
import { FirstLetterSpeakRep } from "@/components/drills/FirstLetterSpeakRep";

interface SrsEntityRecallProps {
  verses: VerseSegment[];
  sessionKey: string;
  // The chapter's own real reading-view page layout (see lib/useWholeChapterReadingLayout.ts)
  // — every real verse in `verses` renders on the SAME real page/size/position/sense-line
  // parsing the Path screen's own reading view uses (see FirstLetterMultiVersePageCard.tsx).
  layout: ChapterReadingLayout;
  onComplete: (accuracy: number) => void;
  onVerseAccuracy: (results: VerseAccuracy[]) => void;
}

// Recites this SRS entity's whole verse range in one continuous pass — first letter only,
// either typed or spoken (see the reader's own srsSpeakModeEnabled setting) — checkpointed
// under this entity's own sessionKey so a reload, crash, or navigating away mid-review resumes
// right where it left off (see lib/useSessionCheckpoint.ts) rather than restarting from word 1.
export function SrsEntityRecall({ verses, sessionKey, layout, onComplete, onVerseAccuracy }: SrsEntityRecallProps) {
  const speakModeEnabled = useProgressStore((state) => state.srsSpeakModeEnabled);
  const combinedVerse = joinVerses(verses, "entity");
  const verseMarkers = verseNumberMarkers(verses);

  function handleComplete(_hadMistake: boolean, accuracy: number) {
    onComplete(accuracy);
  }

  return (
    <div className="flex flex-col gap-3">
      {speakModeEnabled ? (
        <FirstLetterSpeakRep
          key="speak"
          verse={combinedVerse}
          verses={verses}
          layout={layout}
          verseMarkers={verseMarkers}
          moveAutoCompleteToVerseView
          onVerseAccuracy={onVerseAccuracy}
          onComplete={handleComplete}
        />
      ) : (
        <FirstLetterTypeRep
          key="type"
          verse={combinedVerse}
          verses={verses}
          layout={layout}
          reps={1}
          sessionKey={sessionKey}
          verseMarkers={verseMarkers}
          restartOnMistake={false}
          stageLabel=""
          lettersOnly
          moveAutoCompleteToVerseView
          onVerseAccuracy={onVerseAccuracy}
          onComplete={handleComplete}
        />
      )}
    </div>
  );
}
