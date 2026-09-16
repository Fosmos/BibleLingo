"use client";

import type { VerseSegment, WordDiffToken } from "@/types";
import { useReviewChain } from "@/lib/useReviewChain";
import { AutoCompleteButton } from "@/components/ui/AutoCompleteButton";
import { OnScreenKeyboard } from "@/components/ui/OnScreenKeyboard";
import { InfoTip } from "@/components/ui/InfoTip";
import { INFO_TIPS } from "@/lib/infoTipCopy";
import { ReferenceNumberEntry } from "@/components/drills/ReferenceNumberEntry";
import { ReviewChainResult } from "@/components/drills/ReviewChainResult";
import { ReviewChainHint } from "@/components/drills/ReviewChainHint";
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
  // See lib/useReviewChain.ts's own doc comment on both of these.
  restartOnMistake?: boolean;
  requirePerfectPass?: boolean;
}

export function ReviewChain({ verses, onComplete, label = "Review", layout, restartOnMistake = true, requirePerfectPass }: ReviewChainProps) {
  const typing = useReviewChain({ verses, restartOnMistake, requirePerfectPass });
  const { combinedWords, wordIndex, revealedWords, letterInput, restartNotice, wrongWordIndices, finished, currentWord, currentVerse, referenceMatch } = typing;
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

      <LessonControlBar dockRef={layout?.dockRef} verseText={verses.map((v) => v.text).join(" ")}>
        {layout && <p className="self-center text-caption font-semibold uppercase tracking-wide text-brand-500">{label}</p>}
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
            aria-label="Type the first letter of the next word"
            className="sr-only"
          />
        )}
        {restartNotice && <p className="text-sm font-medium text-heart-600">{restartNotice}</p>}
        {!referenceMatch && <OnScreenKeyboard onKey={typing.handleLetterChange} />}
        {!referenceMatch && (
          <div className="flex items-center gap-4">
            <ReviewChainHint
              onRevealWord={() => {
                if (restartOnMistake && !requirePerfectPass) {
                  typing.recordMistake(`That word was "${currentWord.word}" — restarting this verse from the beginning.`);
                } else {
                  typing.markWrongAndAdvance();
                }
              }}
            />
          </div>
        )}
        <AutoCompleteButton onClick={() => onComplete(100)} />
      </LessonControlBar>
    </div>
  );
}
