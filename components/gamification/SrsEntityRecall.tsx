"use client";

import type { VersePOA, VerseSegment } from "@/types";
import { firstLettersDisplay } from "@/lib/verseFirstLetters";
import type { VerseAccuracy } from "@/lib/verseAccuracyBreakdown";
import type { ChapterReadingLayout } from "@/lib/useChapterReadingLayout";
import { joinVerses, verseNumberMarkers } from "@/lib/verseBatching";
import { useProgressStore } from "@/store/useProgressStore";
import { FirstLetterTypeRep } from "@/components/drills/FirstLetterTypeRep";
import { FirstLetterSpeakRep } from "@/components/drills/FirstLetterSpeakRep";
import { VerseRevealHelp } from "@/components/ui/VerseRevealHelp";

interface SrsEntityRecallProps {
  verses: VerseSegment[];
  sessionKey: string;
  label: string;
  // The chapter's own real reading-view page layout (see lib/useWholeChapterReadingLayout.ts)
  // — every real verse in `verses` renders on the SAME real page/size/position the reading
  // view itself uses, any pericope heading it opens showing decoratively right there, same as
  // everywhere else in the app (see FirstLetterMultiVersePageCard.tsx).
  layout: ChapterReadingLayout;
  entityPOA?: VersePOA;
  onRestart: () => void;
  onComplete: (accuracy: number) => void;
  onVerseAccuracy: (results: VerseAccuracy[]) => void;
}

// Recites this SRS entity's whole verse range in one continuous pass — first letter only,
// either typed or spoken (see the reader's own srsSpeakModeEnabled setting) — checkpointed
// under this entity's own sessionKey so a reload, crash, or navigating away mid-review resumes
// right where it left off (see lib/useSessionCheckpoint.ts) rather than restarting from word 1.
// A merged, multi-pericope entity used to gate each new section behind its own separate blind
// heading-typing step; now that every pericope heading already shows decoratively on the real
// page itself (see `layout` above), that separate gate is gone — the heading is simply part of
// what's on the page as the reader reaches it, same as Learn and the main reading view.
export function SrsEntityRecall({ verses, sessionKey, label, layout, entityPOA, onRestart, onComplete, onVerseAccuracy }: SrsEntityRecallProps) {
  const speakModeEnabled = useProgressStore((state) => state.srsSpeakModeEnabled);
  const combinedVerse = joinVerses(verses, "entity");
  const verseMarkers = verseNumberMarkers(verses);
  const fullText = verses.map((verse) => verse.text).join(" ");

  function handleComplete(_hadMistake: boolean, accuracy: number) {
    onComplete(accuracy);
  }

  // Rendered INSIDE FirstLetterTypeRep/FirstLetterSpeakRep's own control bar (via
  // `extraControls` — see their own doc comment) rather than as a sibling below it: content
  // sitting below the sticky dock isn't accounted for by lib/useParchmentFillHeight.ts's own
  // measurement, so it used to silently push the whole page taller than the viewport, forcing
  // a document-level scroll the reading view itself never needs.
  const revealHelp = (
    <VerseRevealHelp
      reference={label}
      fullText={fullText}
      firstLettersText={firstLettersDisplay(fullText, verseMarkers)}
      visualHint={entityPOA ? { who: entityPOA.who, action: entityPOA.action, additionalInfo: entityPOA.additionalInfo, scene: entityPOA.scene } : undefined}
      startLevel="firstLetters"
      onReset={onRestart}
    />
  );

  return (
    <div className="flex flex-col gap-3">
      {speakModeEnabled ? (
        <FirstLetterSpeakRep
          key="speak"
          verse={combinedVerse}
          verses={verses}
          layout={layout}
          verseMarkers={verseMarkers}
          allowPeekHint
          onVerseAccuracy={onVerseAccuracy}
          onComplete={handleComplete}
          extraControls={revealHelp}
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
          autoRevealLetterOnMistake={false}
          lettersOnly
          allowPeekHint
          onVerseAccuracy={onVerseAccuracy}
          onComplete={handleComplete}
          extraControls={revealHelp}
        />
      )}
    </div>
  );
}
