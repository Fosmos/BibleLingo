"use client";

import { useEffect, useRef, type ReactNode } from "react";
import type { VerseSegment } from "@/types";
import type { VerseAccuracy } from "@/lib/verseAccuracyBreakdown";
import type { WordAnnotationMap } from "@/lib/verseHighlights";
import { useFirstLetterTyping } from "@/lib/useFirstLetterTyping";
import { RevealedWordsList } from "@/components/drills/RevealedWordsList";
import { WordRevealLine } from "@/components/drills/WordRevealLine";
import { InfoTip } from "@/components/ui/InfoTip";
import { INFO_TIPS } from "@/lib/infoTipCopy";
import { FirstLetterTypingControls } from "@/components/drills/FirstLetterTypingControls";
import { VerseContextLine } from "@/components/ui/VerseContextLine";
import { VerseReferenceHeader } from "@/components/ui/VerseReferenceHeader";
import { VerseTextLine } from "@/components/ui/VerseTextLine";
import type { ChapterReadingLayout } from "@/lib/useChapterReadingLayout";
import { LessonParchmentCard } from "@/components/gamification/LessonParchmentCard";
import { LessonControlBar } from "@/components/gamification/LessonControlBar";
import { LessonPageCard } from "@/components/gamification/LessonPageCard";
import { FirstLetterMultiVersePageCard } from "@/components/drills/FirstLetterMultiVersePageCard";

interface FirstLetterTypeRepProps {
  verse: VerseSegment;
  reps: number;
  // Set (alongside `layout` below) by the Learn flow only, to pick the "whole verse, blanks
  // fill in place" reveal style — SRS review (every other caller) leaves this undefined and
  // keeps the plain previousVerse/nextVerse treatment below.
  contextVerses?: VerseSegment[];
  // accuracy is 0-100: share of this verse's own words typed correctly first-try — used by
  // SRS review for box promotion.
  onComplete: (hadMistake: boolean, accuracy: number) => void;
  // Checkpoints wordIndex so leaving mid-verse resumes here instead of restarting — used by
  // SRS review, which has no coarser "which stage" checkpoint to fall back on.
  sessionKey?: string;
  // The immediately preceding/following verse, shown above/below the revealed-words box.
  previousVerse?: VerseSegment;
  nextVerse?: VerseSegment;
  // When true, the verse reference is shown inline with the revealed text (matching
  // RhythmRep.tsx) instead of via VerseReferenceHeader — used by the Learn flow's final stage.
  inlineReference?: boolean;
  // Highlights from the Learn flow's Orientation stage — undefined for SRS review.
  annotations?: WordAnnotationMap;
  // Which word index each verse after the first starts at — undefined for SRS review.
  verseMarkers?: Record<number, number>;
  // When false, a mistake is recorded toward `accuracy` but doesn't wipe already-revealed
  // words back to word 1 — the reader just retries the current word. Used by SRS review,
  // where box promotion already gates on the resulting accuracy percentage (see
  // lib/srs.ts's PROMOTION_ACCURACY_THRESHOLD) rather than requiring one clean run through.
  restartOnMistake?: boolean;
  // Overrides the caption normally shown ("Type it by first letter") — used by the Learn
  // flow's closing stage, which groups under "Remember" like every other stage past Learn.
  // Left unset (SRS review) keeps the original, more literal caption.
  stageLabel?: string;
  // See MistakeLetterHint.tsx — false hides the letter until "Reveal letter" is tapped.
  autoRevealLetterOnMistake?: boolean;
  // See RevealedWordsList.tsx — SRS review only. Keeps the actual verse text off the screen
  // entirely: a correct guess reveals just that word's own first letter, not the word itself.
  lettersOnly?: boolean;
  // Reports accuracy broken down per individual verse (via verseMarkers) alongside the usual
  // whole-segment `accuracy` — used by SRS review to flag a weak verse into Problem Verses
  // even when the group's overall accuracy is fine. Undefined for every other caller.
  onVerseAccuracy?: (results: VerseAccuracy[]) => void;
  // Shows a low-priority "Peek hint" button that reveals the current word's first letter on
  // demand, same accuracy cost as an actual mistake but never restarts the rep — an emergency
  // escape valve for review modes specifically (see SrsEntityRecall.tsx), where hitting a
  // total memory wall would otherwise block the session with no way through. Left off (the
  // Learn flow's own usage) since a brand-new verse hasn't earned a shortcut around learning
  // it yet.
  allowPeekHint?: boolean;
  // The reading view's own real page layout (see lib/useChapterReadingLayout.ts) — set
  // alongside `contextVerses` by the Learn flow, or alongside `verses` by SRS review (see
  // lib/useWholeChapterReadingLayout.ts). Undefined only for a caller with no real-page
  // concept of its own (Vespers), which keeps the plain previousVerse/nextVerse treatment
  // below. When set, the verse(s) render on the SAME real reading-view page/size/position as
  // browsing, instead of a smaller custom-built window.
  layout?: ChapterReadingLayout;
  // SRS review only (see SrsEntityRecall.tsx) — every real verse this entity's own `verse`
  // (the combined synthetic verse this component's own typing state is keyed to) was joined
  // from. Set alongside `layout` and always with `lettersOnly` — renders via
  // FirstLetterMultiVersePageCard.tsx instead of the single-verse `layout` branch below, since
  // a review entity can span several real verses at once, each needing its own real page
  // position, not just one.
  verses?: VerseSegment[];
  // Extra controls (SRS review's own VerseRevealHelp "peek at the answer" trigger) rendered
  // inside this component's own control bar, alongside its normal letter-input row, so they're
  // part of the SAME measured/capped dock (see lib/useParchmentFillHeight.ts) instead of a
  // separate sibling below it — content sitting below the dock, unmeasured, was pushing the
  // whole page taller than the viewport, forcing a document-level scroll the reading view
  // itself never needs.
  extraControls?: ReactNode;
}

// Reveal/scoring state itself lives in lib/useFirstLetterTyping.ts — this component is just
// its render: a native, single-character text input for typing each word's first letter.
export function FirstLetterTypeRep({
  verse,
  reps,
  onComplete,
  sessionKey,
  previousVerse,
  nextVerse,
  contextVerses,
  inlineReference,
  annotations,
  verseMarkers,
  restartOnMistake = true,
  stageLabel = "Type it by first letter",
  onVerseAccuracy,
  autoRevealLetterOnMistake = true,
  lettersOnly,
  allowPeekHint,
  layout,
  verses,
  extraControls,
}: FirstLetterTypeRepProps) {
  const typing = useFirstLetterTyping({ verse, reps, sessionKey, verseMarkers, restartOnMistake, onComplete, onVerseAccuracy });
  const revealedRef = useRef<HTMLDivElement>(null);

  // Keeps the revealed-words box pinned near the top instead of drifting out of view as more
  // words reveal.
  useEffect(() => {
    revealedRef.current?.scrollTo({ top: revealedRef.current.scrollHeight });
  }, [typing.revealedWords.length]);

  // The Learn flow (contextVerses/layout set) shows the WHOLE verse from the start, each
  // not-yet-typed word reserved as blank space that fills in place as it's typed (see
  // WordRevealLine.tsx) — everything else (SRS review) keeps the original "only show what's
  // been revealed" behavior, unchanged. No verse-number sup here when `layout` is set —
  // ChapterVerseRun.tsx already renders that verse's own real number unconditionally.
  const activeVerseWords = (
    <>
      {!layout && <sup className="mr-0.5 text-[0.7em] font-semibold text-ink-muted dark:text-zinc-500">{typing.currentVerseNumber}</sup>}
      {contextVerses ? (
        <WordRevealLine words={typing.allWords} revealedCount={typing.revealedWords.length} annotations={annotations} verseMarkers={verseMarkers} />
      ) : (
        <RevealedWordsList words={typing.revealedWords} annotations={annotations} verseMarkers={verseMarkers} lettersOnly={lettersOnly} />
      )}
    </>
  );

  return (
    <div className="flex flex-col gap-3">
      {!layout && (
        <div>
          <p className="flex items-center gap-1.5 text-caption font-semibold uppercase tracking-wide text-brand-500">
            {stageLabel} <InfoTip text={INFO_TIPS.firstLetterTypeRep} />
          </p>
          <VerseReferenceHeader
            book={verse.book}
            chapter={verse.chapter}
            verseNumber={typing.currentVerseNumber}
            reference={inlineReference ? undefined : verse.reference}
          />
        </div>
      )}
      {verses && layout ? (
        <FirstLetterMultiVersePageCard
          layout={layout}
          verses={verses}
          revealedCount={typing.revealedWords.length}
          currentVerseNumber={typing.currentVerseNumber}
        />
      ) : layout ? (
        <LessonPageCard layout={layout} activeVerse={verse} renderActiveVerse={() => activeVerseWords} />
      ) : (
        <LessonParchmentCard>
          <p className="mb-1 text-sm text-ink-muted">
            Rep {typing.completedReps + 1} of {reps}
          </p>
          {previousVerse && <VerseContextLine verse={previousVerse} />}
          <div ref={revealedRef} className="max-h-36 min-h-8 overflow-y-auto">
            <p className="text-lg leading-relaxed">
              {inlineReference && <VerseTextLine chapter={verse.chapter} verseNumber={verse.verseNumber} />}
              {activeVerseWords}
            </p>
          </div>
          {nextVerse && <VerseContextLine verse={nextVerse} />}
        </LessonParchmentCard>
      )}

      <LessonControlBar dockRef={layout?.dockRef}>
        <FirstLetterTypingControls
          typing={typing}
          showLabel={layout ? stageLabel : undefined}
          allowPeekHint={allowPeekHint}
          autoRevealLetterOnMistake={autoRevealLetterOnMistake}
        />
        {extraControls}
      </LessonControlBar>
    </div>
  );
}
