"use client";

import { useEffect, useMemo, useState } from "react";
import type { VerseSegment } from "@/types";
import { playCorrectSfx } from "@/lib/audio";
import { tokenizeVerseWords, firstWordCharacter } from "@/lib/verseWords";

export interface CombinedWord {
  word: string;
  verseIndex: number;
}

const REFERENCE_PATTERN = /^(\d+):(\d+)$/;

function buildCombinedWords(verses: VerseSegment[]): CombinedWord[] {
  return verses.flatMap((verse, verseIndex) => tokenizeVerseWords(verse.text).map((word) => ({ word, verseIndex })));
}

interface UseReviewChainOptions {
  verses: VerseSegment[];
  // False for a genuine "review previously-learned verses" caller — a mistake costs accuracy
  // and just retries the SAME word. True (default) for LearnSection.tsx's own
  // type_cumulative_today check.
  restartOnMistake: boolean;
  // Resume point — the next word to type and the words already missed (see lib/useSrsReviewRun.ts).
  initialProgress?: ReviewChainProgress;
  // Told the reader's place after every change, so it can be saved for later.
  onProgress?: (progress: ReviewChainProgress) => void;
}

export interface ReviewChainProgress {
  wordIndex: number;
  wrongWordIndices: number[];
}

export interface ReviewChainTyping {
  combinedWords: CombinedWord[];
  wordIndex: number;
  revealedWords: string[];
  letterInput: string;
  // Shown briefly after a mistake — cleared once the next word is typed correctly. Its text
  // says why (and, for a revealed word, what the word actually was).
  restartNotice: string | null;
  wrongWordIndices: Set<number>;
  finished: boolean;
  currentWord: CombinedWord | undefined;
  currentVerse: VerseSegment | null;
  referenceMatch: RegExpMatchArray | null | undefined;
  revealCurrentWord: () => void;
  recordMistake: (notice?: string) => void;
  handleLetterChange: (value: string) => void;
}

// ReviewChain.tsx's own reveal/scoring state and logic, pulled into a hook so that component
// stays render-only — the same "component receives data, hook owns behavior" split
// lib/useFirstLetterTyping.ts already follows for FirstLetterTypeRep — and the only practical
// way to keep ReviewChain.tsx itself under this codebase's own 200-line cap (see CLAUDE.md).
export function useReviewChain({ verses, restartOnMistake, initialProgress, onProgress }: UseReviewChainOptions): ReviewChainTyping {
  const combinedWords = useMemo(() => buildCombinedWords(verses), [verses]);

  const startIndex = Math.min(initialProgress?.wordIndex ?? 0, Math.max(0, combinedWords.length - 1));
  const [wordIndex, setWordIndex] = useState(startIndex);
  const [revealedWords, setRevealedWords] = useState<string[]>(() => combinedWords.slice(0, startIndex).map((combined) => combined.word));
  const [letterInput, setLetterInput] = useState("");
  const [restartNotice, setRestartNotice] = useState<string | null>(null);
  const [wrongWordIndices, setWrongWordIndices] = useState<Set<number>>(() => new Set(initialProgress?.wrongWordIndices ?? []));
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    if (!finished) onProgress?.({ wordIndex, wrongWordIndices: [...wrongWordIndices] });
  }, [wordIndex, wrongWordIndices, finished, onProgress]);

  const currentWord = combinedWords[wordIndex];
  const currentVerse = currentWord ? verses[currentWord.verseIndex] : null;
  const referenceMatch = currentWord?.word.match(REFERENCE_PATTERN);

  function revealCurrentWord() {
    if (!currentWord) return;
    setRestartNotice(null);
    setLetterInput("");
    const next = wordIndex + 1;
    if (next >= combinedWords.length) {
      setRevealedWords((prev) => [...prev, currentWord.word]);
      setFinished(true);
    } else {
      setRevealedWords((prev) => [...prev, currentWord.word]);
      setWordIndex(next);
    }
  }

  // restartOnMistake on: restarts THIS verse's reveal from its own first word.
  const mistakeNotice = restartOnMistake ? "Not quite — restarting this verse from the beginning." : "Not quite — try again.";

  // restartOnMistake on: restarts THIS verse's reveal from its own first word. Otherwise: just
  // retries the SAME word — nothing already revealed is lost either way beyond that.
  function recordMistake(notice = mistakeNotice) {
    setWrongWordIndices((prev) => new Set(prev).add(wordIndex));
    if (restartOnMistake && currentWord) {
      const verseStart = combinedWords.findIndex((word) => word.verseIndex === currentWord.verseIndex);
      setRevealedWords((prev) => prev.slice(0, verseStart));
      setWordIndex(verseStart);
    }
    setRestartNotice(notice);
    setLetterInput("");
  }

  function handleLetterChange(value: string) {
    if (!currentWord) return;
    const expected = firstWordCharacter(currentWord.word)?.toLowerCase();
    const typed = value.toLowerCase();

    if (typed && typed === expected) {
      playCorrectSfx();
      revealCurrentWord();
    } else if (typed) {
      // Silent on a wrong letter — the red notice is enough, no penalty sound.
      recordMistake();
    }
  }

  return {
    combinedWords,
    wordIndex,
    revealedWords,
    letterInput,
    restartNotice,
    wrongWordIndices,
    finished,
    currentWord,
    currentVerse,
    referenceMatch,
    revealCurrentWord,
    recordMistake,
    handleLetterChange,
  };
}
