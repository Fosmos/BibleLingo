"use client";

import { useMemo, useRef, useState } from "react";
import type { VersePOA, VerseSegment } from "@/types";
import { firstLettersDisplay } from "@/lib/verseFirstLetters";
import type { VerseAccuracy } from "@/lib/verseAccuracyBreakdown";
import type { PericopeInfo } from "@/lib/chapterPericopes";
import { buildRecallSteps } from "@/lib/pericopeHeadingSteps";
import { joinVerses, verseNumberMarkers } from "@/lib/verseBatching";
import { FirstLetterTypeRep } from "@/components/drills/FirstLetterTypeRep";
import { PericopeHeadingTypeRep } from "@/components/drills/PericopeHeadingTypeRep";
import { CompletedRecallStepView } from "@/components/gamification/CompletedRecallStepView";
import { VerseRevealHelp } from "@/components/ui/VerseRevealHelp";

interface SrsEntityRecallProps {
  verses: VerseSegment[];
  sessionKey: string;
  label: string;
  // Every pericope this entity's range opens (see SrsReviewSession's getPericopeHeadingsInRange)
  // — empty when none do, or when the reader has the pericope-heading-recall setting off.
  pericopeHeadings: PericopeInfo[];
  entityPOA?: VersePOA;
  onRestart: () => void;
  onComplete: (accuracy: number) => void;
  // Per-individual-verse accuracy breakdown for a verses step (never a heading step) — used
  // by SrsReviewSession to flag a weak verse into the Problem Verses bin.
  onVerseAccuracy: (results: VerseAccuracy[]) => void;
}

// Walks this entity's own verses interleaved with a blind type-the-heading gate right before
// the verses each pericope heading opens (see lib/pericopeHeadingSteps.ts) — reached once, in
// order, exactly where that section actually falls rather than all bunched up front. Every
// step finished so far stays visible (see CompletedRecallStepView.tsx) above whichever step
// is active now, so reaching a new heading (or the verses right after it) never clears the
// screen of what came before. A heading step never counts toward accuracy; a verses step's
// word-level results accumulate in totalsRef across every step of this pass, so the overall
// accuracy reported to onComplete (and so SRS box promotion) always reflects the WHOLE
// entity, not just its last step.
export function SrsEntityRecall({
  verses,
  sessionKey,
  label,
  pericopeHeadings,
  entityPOA,
  onRestart,
  onComplete,
  onVerseAccuracy,
}: SrsEntityRecallProps) {
  const steps = useMemo(() => buildRecallSteps(verses, pericopeHeadings), [verses, pericopeHeadings]);
  const [stepIndex, setStepIndex] = useState(0);
  const totalsRef = useRef({ wrongWords: 0, totalWords: 0 });
  const step = steps[stepIndex];

  function advanceOrFinish() {
    const next = stepIndex + 1;
    if (next >= steps.length) {
      const { wrongWords, totalWords } = totalsRef.current;
      onComplete(totalWords > 0 ? Math.round(((totalWords - wrongWords) / totalWords) * 100) : 100);
    } else {
      setStepIndex(next);
    }
  }

  if (!step) return null;

  // Every already-finished step stays on screen, in order, above whichever step is active
  // now — reaching a new pericope's heading (or its own verses right after) never clears the
  // verses already recited, it only ever grows.
  const history = steps.slice(0, stepIndex);

  if (step.kind === "heading") {
    return (
      <div className="flex flex-col gap-6">
        {history.map((completed, index) => (
          <CompletedRecallStepView key={index} step={completed} />
        ))}
        <PericopeHeadingTypeRep
          key={`heading-${stepIndex}`}
          book={step.heading.book}
          chapter={step.heading.chapter}
          startVerse={step.heading.startVerse}
          endVerse={step.heading.endVerse}
          heading={step.heading.heading}
          onComplete={advanceOrFinish}
        />
      </div>
    );
  }

  const combinedVerse = joinVerses(step.verses, `step-${stepIndex}`);
  const verseMarkers = verseNumberMarkers(step.verses);
  const fullText = verses.map((verse) => verse.text).join(" ");
  // The step right before this one, if it's a heading, already showed this exact pericope
  // line in the history above — showing it again via this step's own decorative header would
  // just duplicate it.
  const followsHeading = steps[stepIndex - 1]?.kind === "heading";

  return (
    <div className="flex flex-col gap-6">
      {history.map((completed, index) => (
        <CompletedRecallStepView key={index} step={completed} />
      ))}
      <FirstLetterTypeRep
        key={`verses-${stepIndex}`}
        verse={combinedVerse}
        reps={1}
        sessionKey={`${sessionKey}:${stepIndex}`}
        inlineReference
        verseMarkers={verseMarkers}
        restartOnMistake={false}
        autoRevealLetterOnMistake={false}
        hidePericopeHeader={followsHeading}
        lettersOnly
        onVerseAccuracy={(results) => {
          onVerseAccuracy(results);
          for (const result of results) {
            totalsRef.current.wrongWords += result.wrongCount;
            totalsRef.current.totalWords += result.totalWords;
          }
        }}
        onComplete={advanceOrFinish}
      />
      <VerseRevealHelp
        reference={label}
        fullText={fullText}
        firstLettersText={firstLettersDisplay(fullText, verseNumberMarkers(verses))}
        visualHint={
          entityPOA ? { who: entityPOA.who, action: entityPOA.action, additionalInfo: entityPOA.additionalInfo, scene: entityPOA.scene } : undefined
        }
        startLevel="firstLetters"
        onReset={onRestart}
      />
    </div>
  );
}
