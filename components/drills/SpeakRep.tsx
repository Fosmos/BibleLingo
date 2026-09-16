"use client";

import { useState } from "react";
import type { VerseSegment } from "@/types";
import { firstWordCharacter } from "@/lib/verseWords";
import { useSpeakRepMic } from "@/lib/useSpeakRepMic";
import type { FirstLetterHintToken } from "@/lib/verseFirstLetters";
import { MistakeDiff } from "@/components/drills/MistakeDiff";
import { SpeakRepFallback } from "@/components/drills/SpeakRepFallback";
import { SpeakRepRevealLine } from "@/components/drills/SpeakRepRevealLine";
import { SpeakRepMicButton } from "@/components/drills/SpeakRepMicButton";
import { AutoCompleteButton } from "@/components/ui/AutoCompleteButton";
import { InfoTip } from "@/components/ui/InfoTip";
import { INFO_TIPS } from "@/lib/infoTipCopy";
import { SpeakRepPlainContext } from "@/components/drills/SpeakRepPlainContext";
import type { ChapterReadingLayout } from "@/lib/useChapterReadingLayout";
import type { SenseLineWordRange } from "@/lib/senseLineWordRanges";
import { LessonParchmentCard } from "@/components/gamification/LessonParchmentCard";
import { LessonControlBar } from "@/components/gamification/LessonControlBar";
import { LessonPageCard } from "@/components/gamification/LessonPageCard";

interface SpeakRepProps {
  label: string;
  reference: string;
  targetText: string;
  reps: number;
  showVerse?: boolean;
  // The verse `targetText` belongs to — when both this and `layout` are set, content fills in
  // live on that real reading-view page (LessonPageCard.tsx) instead of the plain fallback
  // (SpeakRepPlainContext.tsx).
  verse?: VerseSegment;
  // Learn flow only — see verse/layout above. No longer read directly (LessonPageCard derives
  // the real page and its own heading from `layout` itself), kept only as the other half of
  // the "is this the Learn flow" check every other Learn-flow-only prop here already uses.
  contextVerses?: VerseSegment[];
  // The reading view's own real page layout (see lib/useChapterReadingLayout.ts) — set
  // alongside `verse`/`contextVerses` by the Learn flow only.
  layout?: ChapterReadingLayout;
  // Non-context callers only (see SpeakRepPlainContext.tsx) — a first-letters hover-hint list.
  hintTokens?: FirstLetterHintToken[];
  onComplete: (hadMistake: boolean) => void;
  // Fires the instant an attempt is judged wrong, before the retry — a life-loss counter
  // can't wait for onComplete, which only fires once the rep is eventually gotten right.
  onMistake?: () => void;
  // Plain fallback context only — see SpeakRepPlainContext.tsx.
  previousVerse?: VerseSegment;
  nextVerse?: VerseSegment;
  // When true, a missed attempt's diff shows only each word's first letter, not the full
  // correct word — the Learn flow's closing stage shouldn't hand back the answer it's testing.
  firstLettersOnMistake?: boolean;
}

export function SpeakRep({
  label,
  reference,
  targetText,
  reps,
  showVerse,
  hintTokens,
  verse,
  contextVerses,
  layout,
  onComplete,
  onMistake,
  previousVerse,
  nextVerse,
  firstLettersOnMistake,
}: SpeakRepProps) {
  const [openWordIndex, setOpenWordIndex] = useState<number | null>(null); // tapped-open hint word
  const mic = useSpeakRepMic({ targetText, reps, onComplete, onMistake });
  const { completedReps, isListening, liveTranscript, revealedCount, mistake, permissionDenied, hadMistakeRef, supported, isSecure, handleStart, handleStop } =
    mic;
  const toggleWord = (index: number) => setOpenWordIndex((prev) => (prev === index ? null : index));

  const showFallback = !supported || permissionDenied || !isSecure;
  const hasContext = Boolean(verse && contextVerses && layout);
  // The Learn flow's own live fill (SpeakRepRevealLine), scoped to this ONE clause's own range
  // (see LessonPageCard.tsx's own renderActiveVerse doc comment) — only ever used when
  // `hasContext` is true, so no need to re-check it here. `range.clause.text` is this clause's
  // own real substring (no re-tokenizing needed for the `showVerse` case); `revealedCount` is
  // clamped down to this clause's own word count and offset by its own startIndex, since it
  // counts against the WHOLE verse.
  function renderActiveVerseRange(_: VerseSegment, range: SenseLineWordRange) {
    const clauseWordCount = range.endIndex - range.startIndex;
    const clauseRevealedCount = Math.max(0, Math.min(clauseWordCount, revealedCount - range.startIndex));
    return (
      <>
        {showVerse && range.clause.text}
        {!showVerse && <SpeakRepRevealLine text={range.clause.text} revealedCount={clauseRevealedCount} mode={hintTokens ? "hint" : "blind"} />}
      </>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {!hasContext && (
        <div>
          <p className="flex items-center gap-1.5 text-caption font-semibold uppercase tracking-wide text-brand-500">{label} <InfoTip text={INFO_TIPS.speakRep} /></p>
          <p className="text-title">{reference}</p>
        </div>
      )}
      {hasContext && verse && layout ? (
        <LessonPageCard layout={layout} activeVerse={verse} renderActiveVerse={renderActiveVerseRange} />
      ) : (
        <LessonParchmentCard>
          <SpeakRepPlainContext
            previousVerse={previousVerse}
            nextVerse={nextVerse}
            showVerse={showVerse}
            targetText={targetText}
            hintTokens={hintTokens}
            openWordIndex={openWordIndex}
            onToggleWord={toggleWord}
          />
          {isListening && !showFallback && (
            <p className="mt-3 min-h-6 text-lg leading-relaxed text-ink-soft dark:text-zinc-300">
              {liveTranscript || <span className="text-ink-muted">Listening — recite at your own pace...</span>}
            </p>
          )}
        </LessonParchmentCard>
      )}

      <LessonControlBar dockRef={layout?.dockRef} verseText={targetText}>
        {hasContext && <p className="self-center text-caption font-semibold uppercase tracking-wide text-brand-500">{label}</p>}
        {reps > 1 && <p className="text-xs text-ink-muted">Rep {completedReps + 1} of {reps}</p>}
        {hasContext && isListening && !showFallback && (
          <p className="min-h-5 text-center text-sm text-ink-soft dark:text-zinc-300">
            {liveTranscript || <span className="text-ink-muted">Listening — recite at your own pace...</span>}
          </p>
        )}
        {showFallback ? (
          <SpeakRepFallback
            isSecure={isSecure}
            permissionDenied={permissionDenied}
            supported={supported}
            onSkip={() => onComplete(hadMistakeRef.current)}
            onRetry={handleStart}
          />
        ) : (
          <SpeakRepMicButton isListening={isListening} onStart={handleStart} onStop={handleStop} />
        )}
        {mistake && (
          <MistakeDiff
            spokenLabel="What we heard:"
            spokenTokens={mistake.spoken}
            label={firstLettersOnMistake ? "Not quite — correct verse, first letters:" : "Not quite — here's the correct verse:"}
            tokens={
              firstLettersOnMistake ? mistake.verse.map((token) => ({ ...token, word: firstWordCharacter(token.word) ?? token.word })) : mistake.verse
            }
          />
        )}
        <AutoCompleteButton onClick={() => onComplete(hadMistakeRef.current)} />
      </LessonControlBar>
    </div>
  );
}
