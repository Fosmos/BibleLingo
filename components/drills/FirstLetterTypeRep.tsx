"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { VerseSegment } from "@/types";
import { playCorrectSfx, playIncorrectSfx } from "@/lib/audio";
import { useCheckpointField } from "@/lib/useSessionCheckpoint";
import { tokenizeVerseWords, firstWordCharacter } from "@/lib/verseWords";
import { computeVerseAccuracies, type VerseAccuracy } from "@/lib/verseAccuracyBreakdown";
import { verseNumberAtWordIndex } from "@/lib/verseBatching";
import type { WordAnnotationMap } from "@/lib/verseHighlights";
import { RevealedWordsList } from "@/components/drills/RevealedWordsList";
import { MistakeLetterHint } from "@/components/drills/MistakeLetterHint";
import { AutoCompleteButton } from "@/components/ui/AutoCompleteButton";
import { InfoTip } from "@/components/ui/InfoTip";
import { INFO_TIPS } from "@/lib/infoTipCopy";
import { ReferenceNumberEntry } from "@/components/drills/ReferenceNumberEntry";
import { VerseContextLine } from "@/components/ui/VerseContextLine";
import { VerseReferenceHeader } from "@/components/ui/VerseReferenceHeader";
import { VerseTextLine } from "@/components/ui/VerseTextLine";

interface FirstLetterTypeRepProps {
  verse: VerseSegment;
  reps: number;
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
  // See VerseReferenceHeader.tsx — true when a caller already showed this exact pericope
  // line itself a moment ago (SrsEntityRecall.tsx's CompletedRecallStepView).
  hidePericopeHeader?: boolean;
  // See RevealedWordsList.tsx — SRS review only. Keeps the actual verse text off the screen
  // entirely: a correct guess reveals just that word's own first letter, not the word itself.
  lettersOnly?: boolean;
  // Reports accuracy broken down per individual verse (via verseMarkers) alongside the usual
  // whole-segment `accuracy` — used by SRS review to flag a weak verse into Problem Verses
  // even when the group's overall accuracy is fine. Undefined for every other caller.
  onVerseAccuracy?: (results: VerseAccuracy[]) => void;
}

const REFERENCE_PATTERN = /^(\d+):(\d+)$/;

export function FirstLetterTypeRep({
  verse,
  reps,
  onComplete,
  sessionKey,
  previousVerse,
  nextVerse,
  inlineReference,
  annotations,
  verseMarkers,
  restartOnMistake = true,
  stageLabel = "Type it by first letter",
  onVerseAccuracy,
  autoRevealLetterOnMistake = true,
  hidePericopeHeader,
  lettersOnly,
}: FirstLetterTypeRepProps) {
  const words = useMemo(() => tokenizeVerseWords(verse.text), [verse.text]);
  const [completedReps, setCompletedReps] = useState(0);
  const [wordIndex, setWordIndex] = useCheckpointField(sessionKey, "wordIndex", 0);
  // "What's been revealed" is always exactly the words before the current one.
  const revealedWords = words.slice(0, wordIndex);
  const [letterInput, setLetterInput] = useState("");
  const [showError, setShowError] = useState(false);
  const [wrongLetterExpected, setWrongLetterExpected] = useState<string | null>(null);
  // Read synchronously via ref so the value reported to onComplete is never stale.
  const hadMistakeRef = useRef(false);
  // Word positions ever mistyped, across every rep and restart — doesn't reset across reps.
  const [wrongWordIndices, setWrongWordIndices] = useState<Set<number>>(new Set());
  const accuracy = words.length > 0 ? Math.round(((words.length - wrongWordIndices.size) / words.length) * 100) : 100;
  const revealedRef = useRef<HTMLDivElement>(null);

  // Keeps the input pinned near the top instead of drifting behind the on-screen keyboard.
  useEffect(() => {
    revealedRef.current?.scrollTo({ top: revealedRef.current.scrollHeight });
  }, [wordIndex]);

  const currentWord = words[wordIndex];
  const referenceMatch = currentWord?.match(REFERENCE_PATTERN);
  function reportComplete() {
    onVerseAccuracy?.(computeVerseAccuracies(words, verseMarkers, verse.verseNumber, wrongWordIndices));
    onComplete(hadMistakeRef.current, accuracy);
  }
  function revealCurrentWord() {
    if (!currentWord) return;
    setShowError(false);
    setWrongLetterExpected(null);
    setLetterInput("");
    const nextWordIndex = wordIndex + 1;
    if (nextWordIndex >= words.length) {
      const nextRep = completedReps + 1;
      if (nextRep >= reps) {
        reportComplete();
      } else {
        setCompletedReps(nextRep);
        setWordIndex(0);
      }
    } else {
      setWordIndex(nextWordIndex);
    }
  }

  // A mistake restarts this rep's verse reveal from word 1 rather than just retrying it.
  function handleLetterChange(value: string) {
    if (!currentWord) return;
    const expected = firstWordCharacter(currentWord)?.toLowerCase();
    const typed = value.toLowerCase();

    if (typed && typed === expected) {
      playCorrectSfx();
      revealCurrentWord();
    } else if (typed) {
      playIncorrectSfx();
      setShowError(true);
      setWrongLetterExpected(firstWordCharacter(currentWord) ?? "");
      setLetterInput("");
      hadMistakeRef.current = true;
      setWrongWordIndices((prev) => new Set(prev).add(wordIndex));
      if (restartOnMistake) setWordIndex(0);
    }
  }

  // For a multi-verse segment (verseMarkers), the pericope shown should track whichever
  // verse the reader has actually reached rather than staying fixed on the first.
  const currentVerseNumber = verseNumberAtWordIndex(verseMarkers, wordIndex, verse.verseNumber);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="flex items-center gap-1.5 text-caption font-semibold uppercase tracking-wide text-brand-500">
          {stageLabel} <InfoTip text={INFO_TIPS.firstLetterTypeRep} />
        </p>
        <VerseReferenceHeader
          book={verse.book}
          chapter={verse.chapter}
          verseNumber={currentVerseNumber}
          reference={inlineReference ? undefined : verse.reference}
          hidePericope={hidePericopeHeader}
        />
      </div>
      <p className="text-sm text-ink-muted">
        Rep {completedReps + 1} of {reps}
      </p>
      {previousVerse && <VerseContextLine verse={previousVerse} />}
      <div ref={revealedRef} className="max-h-36 min-h-8 overflow-y-auto">
        <p className="text-lg leading-relaxed">
          {inlineReference && <VerseTextLine chapter={verse.chapter} verseNumber={verse.verseNumber} />}
          <RevealedWordsList words={revealedWords} annotations={annotations} verseMarkers={verseMarkers} lettersOnly={lettersOnly} />
        </p>
      </div>
      {nextVerse && <VerseContextLine verse={nextVerse} />}
      {referenceMatch ? (
        <ReferenceNumberEntry
          key={currentWord}
          chapter={referenceMatch[1]}
          verse={referenceMatch[2]}
          onDone={revealCurrentWord}
          onMistake={() => {
            hadMistakeRef.current = true;
            setWrongWordIndices((prev) => new Set(prev).add(wordIndex));
            if (restartOnMistake) setWordIndex(0);
          }}
        />
      ) : (
        <input
          value={letterInput}
          onChange={(event) => handleLetterChange(event.target.value)}
          maxLength={1}
          autoFocus
          aria-label="Type the first letter of the next word"
          className={`w-16 rounded-xl border p-3 text-center text-xl focus:outline-none focus-visible:ring-2 dark:bg-zinc-900 ${showError ? "border-heart-500 focus-visible:ring-heart-500" : "border-line focus-visible:ring-brand-500 dark:border-zinc-700"}`}
        />
      )}
      {!referenceMatch && showError && wrongLetterExpected && (
        <MistakeLetterHint key={wordIndex} expectedLetter={wrongLetterExpected} autoReveal={autoRevealLetterOnMistake} />
      )}
      <AutoCompleteButton onClick={reportComplete} />
    </div>
  );
}
