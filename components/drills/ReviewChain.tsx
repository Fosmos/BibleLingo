"use client";

import { useEffect, useRef, type ReactNode } from "react";
import type { VerseSegment, WordDiffToken } from "@/types";
import { useReviewChain, type ReviewChainProgress } from "@/lib/useReviewChain";
import { AutoCompleteButton } from "@/components/ui/AutoCompleteButton";
import { OnScreenKeyboard } from "@/components/ui/OnScreenKeyboard";
import { InfoTip } from "@/components/ui/InfoTip";
import { INFO_TIPS } from "@/lib/infoTipCopy";
import { MistakeNotice } from "@/components/drills/MistakeNotice";
import { ReferenceNumberEntry } from "@/components/drills/ReferenceNumberEntry";
import { ReviewChainResult } from "@/components/drills/ReviewChainResult";
import { usePeekedVerses } from "@/lib/usePeekedVerses";
import { ReviewChainParchment } from "@/components/drills/ReviewChainParchment";
import type { ChapterReadingLayout } from "@/lib/useChapterReadingLayout";
import { LessonParchmentCard } from "@/components/gamification/LessonParchmentCard";
import { LessonControlBar } from "@/components/gamification/LessonControlBar";

interface ReviewChainProps {
  verses: VerseSegment[];
  onComplete: (accuracy: number) => void;
  label?: string;
  // See ReviewChainParchment.tsx — when set, `verses` render inline on the Learn flow's own
  // real reading-view page instead of the standalone layout every other caller still gets.
  layout?: ChapterReadingLayout;
  // See lib/useReviewChain.ts's own doc comment.
  restartOnMistake?: boolean;
  // Told whichever verse the reader is typing, each time it changes — the Mind Map sheet uses it
  // to keep the real canvas centered on that verse's chip (see lib/useReportFocusVerse.ts).
  onVerseChange?: (verse: VerseSegment) => void;
  // Shown beside View First Letters/View Verse — the Mind Map review's type/speak switch.
  verseViewExtra?: ReactNode;
  // Resume point and progress reports — see lib/useReviewChain.ts.
  initialProgress?: ReviewChainProgress;
  onProgress?: (progress: ReviewChainProgress) => void;
}

export function ReviewChain({ verses, onComplete, label = "Review", layout, restartOnMistake = true, onVerseChange, verseViewExtra, initialProgress, onProgress }: ReviewChainProps) {
  const typing = useReviewChain({ verses, restartOnMistake, initialProgress, onProgress });
  const { combinedWords, wordIndex, revealedWords, letterInput, restartNotice, wrongWordIndices, finished, currentWord, currentVerse, referenceMatch } = typing;
  useEffect(() => {
    if (currentVerse) onVerseChange?.(currentVerse);
  }, [currentVerse, onVerseChange]);
  // Peeking flags a problem verse; finishing clears the ones recalled without a peek.
  const peeks = usePeekedVerses();
  const { settle } = peeks;
  const settledRef = useRef(false);
  useEffect(() => {
    if (!finished || settledRef.current) return;
    settledRef.current = true;
    settle(verses);
  }, [finished, settle, verses]);
  const totalWords = combinedWords.length;

  if (finished) {
    const accuracy = Math.round(((totalWords - wrongWordIndices.size) / totalWords) * 100);
    const mistakeTokens: WordDiffToken[] = combinedWords.map((combined, index) => ({
      word: combined.word,
      correct: !wrongWordIndices.has(index),
    }));
    return (
      <ReviewChainResult
        label={label}
        accuracy={accuracy}
        totalWords={totalWords}
        wrongCount={wrongWordIndices.size}
        mistakeTokens={mistakeTokens}
        onComplete={() => onComplete(accuracy)}
      />
    );
  }

  if (!currentWord) return null;

  const chainParchment = (
    <ReviewChainParchment
      verses={verses}
      combinedWords={combinedWords}
      revealedCount={revealedWords.length}
      currentVerse={currentVerse}
      layout={layout}
    />
  );

  return (
    <div className="flex flex-col gap-3">
      {!layout && (
        <p className="flex items-center gap-1.5 text-caption font-semibold uppercase tracking-wide text-brand-500">
          {label} <InfoTip text={restartOnMistake ? INFO_TIPS.reviewChain : INFO_TIPS.reviewChainNoRestart} />
        </p>
      )}
      {layout ? chainParchment : <LessonParchmentCard>{chainParchment}</LessonParchmentCard>}

      {/* The lookup pair shows only the verse being typed, and opening either one marks it as a
          problem verse (see lib/usePeekedVerses.ts). */}
      <LessonControlBar dockRef={layout?.dockRef} verseText={currentVerse?.text} onVersePeek={() => currentVerse && peeks.peek(currentVerse)} verseViewExtra={verseViewExtra}>
        {layout && <p className="self-center text-caption font-semibold uppercase tracking-wide text-brand-500 [.lesson-sheet-controls_&]:hidden">{label}</p>}
        {referenceMatch ? (
          <ReferenceNumberEntry
            key={`${wordIndex}-${currentWord.word}`}
            chapter={referenceMatch[1]}
            verse={referenceMatch[2]}
            onDone={typing.revealCurrentWord}
            onMistake={typing.recordMistake}
          />
        ) : (
          // Visually hidden, not removed — the on-screen keyboard below is the one visible way
          // to type now (no more redundant box to tap into first), but a real physical keyboard
          // and screen readers still need a focusable text input to type into.
          <input
            value={letterInput}
            onChange={(event) => typing.handleLetterChange(event.target.value)}
            maxLength={1}
            autoFocus
            // The on-screen keyboard is the way to type here — never pop the phone's own over it.
            inputMode="none"
            aria-label="Type the first letter of the next word"
            className="sr-only"
          />
        )}
        <MistakeNotice text={restartNotice} />
        {!referenceMatch && <OnScreenKeyboard onKey={typing.handleLetterChange} />}
        <AutoCompleteButton onClick={() => onComplete(100)} />
      </LessonControlBar>
    </div>
  );
}
