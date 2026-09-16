"use client";

import { useMemo, useState } from "react";
import type { VerseSegment } from "@/types";
import { playCorrectSfx, playIncorrectSfx } from "@/lib/audio";
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
  // The Learn flow's own gentle mode (see lib/useFirstLetterTyping.ts's own identical idea) —
  // a mistake never sounds and never restarts anything mid-pass (just retries the same word,
  // overriding restartOnMistake), but a full pass that picked up any mistake along the way
  // doesn't count — it silently resets to the very first word and runs again until one comes
  // back clean.
  requirePerfectPass?: boolean;
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
  // "Reveal word" hint's own non-restart path (restartOnMistake off, or requirePerfectPass on)
  // — the word's already shown, so just move on instead of retrying it.
  markWrongAndAdvance: () => void;
}

// ReviewChain.tsx's own reveal/scoring state and logic, pulled into a hook so that component
// stays render-only — the same "component receives data, hook owns behavior" split
// lib/useFirstLetterTyping.ts already follows for FirstLetterTypeRep — and the only practical
// way to keep ReviewChain.tsx itself under this codebase's own 200-line cap (see CLAUDE.md).
export function useReviewChain({ verses, restartOnMistake, requirePerfectPass }: UseReviewChainOptions): ReviewChainTyping {
  const combinedWords = useMemo(() => buildCombinedWords(verses), [verses]);

  const [wordIndex, setWordIndex] = useState(0);
  const [revealedWords, setRevealedWords] = useState<string[]>([]);
  const [letterInput, setLetterInput] = useState("");
  const [restartNotice, setRestartNotice] = useState<string | null>(null);
  const [wrongWordIndices, setWrongWordIndices] = useState<Set<number>>(new Set());
  const [finished, setFinished] = useState(false);

  const currentWord = combinedWords[wordIndex];
  const currentVerse = currentWord ? verses[currentWord.verseIndex] : null;
  const referenceMatch = currentWord?.word.match(REFERENCE_PATTERN);

  function revealCurrentWord() {
    if (!currentWord) return;
    setRestartNotice(null);
    setLetterInput("");
    const next = wordIndex + 1;
    if (next >= combinedWords.length) {
      // requirePerfectPass: a pass that picked up any mistake doesn't count — silently back to
      // the very first word, mistakes cleared, try the whole chain again (see
      // lib/useFirstLetterTyping.ts's own identical idea for why).
      if (requirePerfectPass && wrongWordIndices.size > 0) {
        setWrongWordIndices(new Set());
        setRevealedWords([]);
        setWordIndex(0);
        return;
      }
      setRevealedWords((prev) => [...prev, currentWord.word]);
      setFinished(true);
    } else {
      setRevealedWords((prev) => [...prev, currentWord.word]);
      setWordIndex(next);
    }
  }

  // restartOnMistake on (and requirePerfectPass off): restarts THIS verse's reveal from its
  // own first word.
  const mistakeNotice = restartOnMistake && !requirePerfectPass ? "Not quite — restarting this verse from the beginning." : "Not quite — try again.";

  // restartOnMistake on (and requirePerfectPass off): restarts THIS verse's reveal from its
  // own first word. Otherwise: just retries the SAME word — nothing already revealed is lost
  // either way beyond that. requirePerfectPass never sounds on a miss.
  function recordMistake(notice = mistakeNotice) {
    setWrongWordIndices((prev) => new Set(prev).add(wordIndex));
    if (restartOnMistake && !requirePerfectPass && currentWord) {
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
      if (!requirePerfectPass) playIncorrectSfx();
      recordMistake();
    }
  }

  function markWrongAndAdvance() {
    setWrongWordIndices((prev) => new Set(prev).add(wordIndex));
    revealCurrentWord();
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
    markWrongAndAdvance,
  };
}
