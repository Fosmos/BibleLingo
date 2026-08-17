"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { VerseSegment, WordDiffToken } from "@/types";
import { playCorrectSfx, playIncorrectSfx } from "@/lib/audio";
import { TAP_SCALE } from "@/lib/motionTokens";
import { tokenizeVerseWords, firstWordCharacter } from "@/lib/verseWords";
import { AutoCompleteButton } from "@/components/ui/AutoCompleteButton";
import { InfoTip } from "@/components/ui/InfoTip";
import { INFO_TIPS } from "@/lib/infoTipCopy";
import { MistakeDiff } from "@/components/drills/MistakeDiff";
import { ReferenceNumberEntry } from "@/components/drills/ReferenceNumberEntry";

interface ReviewChainProps {
  verses: VerseSegment[];
  onComplete: (accuracy: number) => void;
  label?: string;
}

interface CombinedWord {
  word: string;
  verseIndex: number;
}

const REFERENCE_PATTERN = /^(\d+):(\d+)$/;

function buildCombinedWords(verses: VerseSegment[]): CombinedWord[] {
  return verses.flatMap((verse, verseIndex) => tokenizeVerseWords(verse.text).map((word) => ({ word, verseIndex })));
}

export function ReviewChain({ verses, onComplete, label = "Review" }: ReviewChainProps) {
  const combinedWords = useMemo(() => buildCombinedWords(verses), [verses]);
  const totalWords = combinedWords.length;

  const [wordIndex, setWordIndex] = useState(0);
  const [revealedWords, setRevealedWords] = useState<string[]>([]);
  const [letterInput, setLetterInput] = useState("");
  const [showError, setShowError] = useState(false);
  const [wrongLetterExpected, setWrongLetterExpected] = useState<string | null>(null);
  const [wrongWordIndices, setWrongWordIndices] = useState<Set<number>>(new Set());
  const [finished, setFinished] = useState(false);
  const [showMistakes, setShowMistakes] = useState(false);
  const revealedRef = useRef<HTMLDivElement>(null);

  // Keeps the input pinned near the top of the visible area instead of drifting down (and
  // eventually behind the on-screen keyboard) as a long chapter's revealed text grows — the
  // text scrolls within its own bounded box rather than pushing the rest of the layout down.
  useEffect(() => {
    revealedRef.current?.scrollTo({ top: revealedRef.current.scrollHeight });
  }, [revealedWords]);

  const currentWord = combinedWords[wordIndex];
  const currentReference = currentWord ? verses[currentWord.verseIndex].reference : null;
  const referenceMatch = currentWord?.word.match(REFERENCE_PATTERN);

  function revealCurrentWord() {
    if (!currentWord) return;
    setShowError(false);
    setWrongLetterExpected(null);
    setLetterInput("");
    setRevealedWords((prev) => [...prev, currentWord.word]);
    const next = wordIndex + 1;
    if (next >= combinedWords.length) {
      setFinished(true);
    } else {
      setWordIndex(next);
    }
  }

  function handleLetterChange(value: string) {
    if (!currentWord) return;
    const expected = firstWordCharacter(currentWord.word)?.toLowerCase();
    const typed = value.toLowerCase();

    if (typed && typed === expected) {
      playCorrectSfx();
      revealCurrentWord();
    } else if (typed) {
      playIncorrectSfx();
      setShowError(true);
      setWrongLetterExpected(firstWordCharacter(currentWord.word) ?? "");
      setLetterInput("");
      setWrongWordIndices((prev) => new Set(prev).add(wordIndex));
    }
  }

  if (finished) {
    const accuracy = Math.round(((totalWords - wrongWordIndices.size) / totalWords) * 100);
    const mistakeTokens: WordDiffToken[] = combinedWords.map((combined, index) => ({
      word: combined.word,
      correct: !wrongWordIndices.has(index),
    }));
    return (
      <div className="flex flex-col gap-4 text-center">
        <p className="text-caption font-semibold uppercase tracking-wide text-brand-500">{label} complete</p>
        <p className="text-title">{accuracy}% accuracy</p>
        <p className="text-sm text-ink-muted">
          {totalWords - wrongWordIndices.size} of {totalWords} words correct on the first try.
        </p>
        {wrongWordIndices.size > 0 && (
          <button
            type="button"
            onClick={() => setShowMistakes((prev) => !prev)}
            className="self-center text-sm font-medium text-brand-600 hover:underline"
          >
            {showMistakes ? "Hide mistakes" : "Review mistakes"}
          </button>
        )}
        {showMistakes && <MistakeDiff label="Words you missed the first time:" tokens={mistakeTokens} />}
        <motion.button
          type="button"
          whileTap={TAP_SCALE}
          onClick={() => onComplete(accuracy)}
          className="self-center rounded-full bg-brand-500 px-6 py-2 text-sm font-semibold text-white"
        >
          Continue
        </motion.button>
      </div>
    );
  }

  if (!currentWord) return null;

  return (
    <div className="flex flex-col gap-6">
      <p className="flex items-center gap-1.5 text-caption font-semibold uppercase tracking-wide text-brand-500">
        {label} <InfoTip text={INFO_TIPS.reviewChain} />
      </p>
      <p className="text-sm text-ink-muted">Now in: {currentReference}</p>
      <div ref={revealedRef} className="max-h-36 overflow-y-auto">
        <p className="text-lg leading-relaxed">{revealedWords.join(" ")}</p>
      </div>
      {referenceMatch ? (
        <ReferenceNumberEntry
          key={`${wordIndex}-${currentWord.word}`}
          chapter={referenceMatch[1]}
          verse={referenceMatch[2]}
          onDone={revealCurrentWord}
          onMistake={() => setWrongWordIndices((prev) => new Set(prev).add(wordIndex))}
        />
      ) : (
        <input
          value={letterInput}
          onChange={(event) => handleLetterChange(event.target.value)}
          maxLength={1}
          autoFocus
          aria-label="Type the first letter of the next word"
          className={`w-16 rounded-xl border p-3 text-center text-xl focus:outline-none focus-visible:ring-2 dark:bg-zinc-900 ${
            showError
              ? "border-heart-500 focus-visible:ring-heart-500"
              : "border-line focus-visible:ring-brand-500 dark:border-zinc-700"
          }`}
        />
      )}
      {!referenceMatch && showError && wrongLetterExpected && (
        <p className="text-sm font-medium text-heart-600">
          Not quite — the next word starts with &quot;{wrongLetterExpected}&quot;.
        </p>
      )}
      <AutoCompleteButton onClick={() => onComplete(100)} />
    </div>
  );
}
