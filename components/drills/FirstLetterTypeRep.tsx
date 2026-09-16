"use client";

import { useEffect, useRef } from "react";
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
import { AutoCompleteButton } from "@/components/ui/AutoCompleteButton";
import type { ChapterReadingLayout } from "@/lib/useChapterReadingLayout";
import type { SenseLineWordRange } from "@/lib/senseLineWordRanges";
import { LessonParchmentCard } from "@/components/gamification/LessonParchmentCard";
import { LessonControlBar } from "@/components/gamification/LessonControlBar";
import { LessonPageCard } from "@/components/gamification/LessonPageCard";
import { FirstLetterMultiVersePageCard } from "@/components/drills/FirstLetterMultiVersePageCard";

interface FirstLetterTypeRepProps {
  verse: VerseSegment;
  reps: number;
  // Set (alongside `layout`) by Learn only, to pick the "whole verse, blanks fill in place"
  // reveal style — every other caller leaves this undefined.
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
  // When true, the verse reference is shown inline with the revealed text instead of via
  // VerseReferenceHeader — used by the Learn flow's final stage.
  inlineReference?: boolean;
  // Highlights from the Learn flow's Orientation stage — undefined for SRS review.
  annotations?: WordAnnotationMap;
  // Which word index each verse after the first starts at — undefined for SRS review.
  verseMarkers?: Record<number, number>;
  // When false, a mistake is recorded toward `accuracy` but doesn't wipe already-revealed
  // words back to word 1 — used by SRS review, which gates box promotion on the resulting
  // accuracy percentage (lib/srs.ts's PROMOTION_ACCURACY_THRESHOLD) instead.
  restartOnMistake?: boolean;
  // Learn's own gentle mode (see lib/useFirstLetterTyping.ts) — a mistake never sounds, but a
  // pass with any mistake silently restarts and runs again until one comes back clean.
  requirePerfectPass?: boolean;
  // Overrides the caption normally shown ("Type it by first letter") — used by the Learn
  // flow's closing stage. Left unset keeps the original, more literal caption.
  stageLabel?: string;
  // See RevealedWordsList.tsx — SRS review only. A correct guess reveals just that word's own
  // first letter, never the real word.
  lettersOnly?: boolean;
  // Reports accuracy broken down per individual verse (via verseMarkers) — used by SRS review
  // to flag a weak verse into Problem Verses even when overall accuracy is fine.
  onVerseAccuracy?: (results: VerseAccuracy[]) => void;
  // A low-priority "Peek hint" button revealing the current word's first letter on demand,
  // same accuracy cost as a mistake but never restarts the rep — an escape valve for review
  // modes (see Vespers). Left off (Learn) since a new verse hasn't earned the shortcut yet.
  allowPeekHint?: boolean;
  // The reading view's own real page layout (see lib/useChapterReadingLayout.ts) — set
  // alongside `contextVerses` by Learn, or alongside `verses` by SRS review. Undefined only
  // for a caller with no real-page concept (Vespers). When set, the verse(s) render on the
  // SAME real reading-view page/size/position as browsing, not a smaller custom window.
  layout?: ChapterReadingLayout;
  // SRS review only — every real verse this entity's own `verse` (the combined synthetic
  // verse typing state is keyed to) was joined from. Set alongside `layout`/`lettersOnly` —
  // renders via FirstLetterMultiVersePageCard.tsx (the SAME real page Learn/the Path screen's
  // own reading view use) instead of the single-verse `layout` branch below.
  verses?: VerseSegment[];
  // SRS review only — moves Auto-complete beside the View First Letters/View Verse pair (see
  // LessonControlBar.tsx's own `verseViewExtra`) instead of its usual spot below the keyboard.
  moveAutoCompleteToVerseView?: boolean;
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
  requirePerfectPass,
  stageLabel = "Type it by first letter",
  onVerseAccuracy,
  lettersOnly,
  allowPeekHint,
  layout,
  verses,
  moveAutoCompleteToVerseView,
}: FirstLetterTypeRepProps) {
  const typing = useFirstLetterTyping({ verse, reps, sessionKey, verseMarkers, restartOnMistake, requirePerfectPass, onComplete, onVerseAccuracy });
  const revealedRef = useRef<HTMLDivElement>(null);

  // Keeps the revealed-words box pinned near the top instead of drifting out of view as more
  // words reveal.
  useEffect(() => {
    revealedRef.current?.scrollTo({ top: revealedRef.current.scrollHeight });
  }, [typing.revealedWords.length]);

  // The Learn flow (contextVerses/layout set) shows the WHOLE verse from the start, each
  // not-yet-typed word reserved as blank space that fills in place as typed (WordRevealLine)
  // — every other caller keeps the original "only show what's been revealed" behavior. No
  // verse-number sup when `layout` is set — ChapterVerseRun.tsx renders the real number.
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

  // Same WordRevealLine state as activeVerseWords above, sliced to this ONE clause's own range
  // (see LessonPageCard.tsx's renderActiveVerse doc) — always pairs with contextVerses (Learn).
  const renderActiveVerseRange = (_: VerseSegment, { startIndex, endIndex }: SenseLineWordRange) => (
    <WordRevealLine words={typing.allWords.slice(startIndex, endIndex)} startIndex={startIndex} revealedCount={typing.revealedWords.length} annotations={annotations} verseMarkers={verseMarkers} />
  );

  // SRS review only (`verses` set) — the ONE real verse currently being recalled, so View
  // First Letters/View Verse (see LessonControlBar.tsx's own `verseText`) peek at just that
  // verse instead of the whole entity's combined range. Every other caller's own `verse` is
  // already a single real verse, so it's used as-is.
  const activeRealVerse = verses?.find((candidate) => candidate.verseNumber === typing.currentVerseNumber) ?? verses?.[0];

  return (
    <div className="flex flex-col gap-3">
      {!layout && (
        <div>
          <p className="flex items-center gap-1.5 text-caption font-semibold uppercase tracking-wide text-brand-500">
            {stageLabel} <InfoTip text={INFO_TIPS.firstLetterTypeRep} />
          </p>
          <VerseReferenceHeader book={verse.book} chapter={verse.chapter} verseNumber={typing.currentVerseNumber} reference={inlineReference ? undefined : verse.reference} />
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
        <LessonPageCard layout={layout} activeVerse={verse} activeWordIndex={typing.revealedWords.length} renderActiveVerse={renderActiveVerseRange} />
      ) : (
        <LessonParchmentCard>
          <p className="mb-1 text-sm text-ink-muted">Rep {typing.completedReps + 1} of {reps}</p>
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

      <LessonControlBar
        dockRef={layout?.dockRef}
        verseText={activeRealVerse?.text ?? verse.text}
        verseMarkers={activeRealVerse ? undefined : verseMarkers}
        verseViewExtra={moveAutoCompleteToVerseView ? <AutoCompleteButton onClick={typing.reportComplete} /> : undefined}
      >
        <FirstLetterTypingControls
          typing={typing}
          showLabel={layout ? stageLabel : undefined}
          allowPeekHint={allowPeekHint}
          hideAutoComplete={moveAutoCompleteToVerseView}
        />
      </LessonControlBar>
    </div>
  );
}
