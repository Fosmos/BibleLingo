"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { VerseSegment } from "@/types";
import { playCorrectSfx, playIncorrectSfx } from "@/lib/audio";
import { useCheckpointField } from "@/lib/useSessionCheckpoint";
import { tokenizeVerseWords, firstWordCharacter } from "@/lib/verseWords";
import { computeVerseAccuracies, type VerseAccuracy } from "@/lib/verseAccuracyBreakdown";
import { verseNumberAtWordIndex } from "@/lib/verseBatching";

const REFERENCE_PATTERN = /^(\d+):(\d+)$/;

interface UseFirstLetterTypingOptions {
  verse: VerseSegment;
  reps: number;
  sessionKey?: string;
  verseMarkers?: Record<number, number>;
  restartOnMistake: boolean;
  // The Learn flow's own "gentle" mode (first time meeting this verse, not yet a real review)
  // — a mistake never makes a sound and never interrupts the pass (overrides restartOnMistake:
  // a mistake always just retries the same word, the same as restartOnMistake off), but a pass
  // that had ANY mistake in it doesn't count as this rep at all — it silently resets to word 1
  // and runs again, as many times as it takes, until one full pass comes back clean. Off (every
  // other caller — SRS review, Mastery-adjacent reps) keeps the plain existing behavior: a
  // mistake sounds and costs accuracy, `reps` completes regardless of how clean any one of them was.
  requirePerfectPass?: boolean;
  onComplete: (hadMistake: boolean, accuracy: number) => void;
  onVerseAccuracy?: (results: VerseAccuracy[]) => void;
}

export interface FirstLetterTyping {
  // Every word in the verse, in order — not just the revealed ones (see revealedWords below)
  // — so a caller can render the whole line from the start, blanking out what's not typed
  // yet instead of only showing what's been revealed so far.
  allWords: string[];
  revealedWords: string[];
  letterInput: string;
  showError: boolean;
  // Set ONLY by the deliberate "Peek Hint" escape valve below, never by a genuine wrong
  // keystroke — a real mistake never reveals the letter (see FirstLetterTypingControls.tsx),
  // so this is how it tells the two apart: showError alone (this null) means "try again," no
  // letter shown; showError with this set means "here's the letter you asked for."
  wrongLetterExpected: string | null;
  currentWord: string | undefined;
  referenceMatch: RegExpMatchArray | null;
  currentVerseNumber: number;
  completedReps: number;
  handleLetterChange: (value: string) => void;
  revealCurrentWord: () => void;
  recordMistake: () => void;
  peekHint: () => void;
  reportComplete: () => void;
}

// All of FirstLetterTypeRep.tsx's own reveal/scoring state and logic, pulled into a hook so
// the component itself stays render-only (per this codebase's own "component receives data,
// hook owns behavior" convention) — word-by-word reveal, per-word mistake tracking
// (wrongWordIndices, feeding both the reported `accuracy` and, via onVerseAccuracy, Problem
// Verses flagging), and the "Peek Hint" escape valve.
export function useFirstLetterTyping({
  verse,
  reps,
  sessionKey,
  verseMarkers,
  restartOnMistake,
  requirePerfectPass = false,
  onComplete,
  onVerseAccuracy,
}: UseFirstLetterTypingOptions): FirstLetterTyping {
  const words = useMemo(() => tokenizeVerseWords(verse.text), [verse.text]);
  const [completedReps, setCompletedReps] = useState(0);
  const [wordIndex, setWordIndex] = useCheckpointField(sessionKey, "wordIndex", 0);
  const [letterInput, setLetterInput] = useState("");
  const [showError, setShowError] = useState(false);
  const [wrongLetterExpected, setWrongLetterExpected] = useState<string | null>(null);
  // Read synchronously via ref so the value reported to onComplete is never stale.
  const hadMistakeRef = useRef(false);
  // Word positions ever mistyped, across every rep and restart — doesn't reset across reps.
  const [wrongWordIndices, setWrongWordIndices] = useState<Set<number>>(new Set());
  // Subset of wrongWordIndices reached via the explicit "Peek hint" escape valve specifically
  // (not a genuine wrong keystroke) — see VerseAccuracy.neededHint's own doc comment for why
  // Problem Verses flagging cares about this distinction and `accuracy` itself doesn't.
  const [hintedWordIndices, setHintedWordIndices] = useState<Set<number>>(new Set());
  const accuracy = words.length > 0 ? Math.round(((words.length - wrongWordIndices.size) / words.length) * 100) : 100;

  const currentWord = words[wordIndex];
  const referenceMatch = currentWord?.match(REFERENCE_PATTERN) ?? null;
  const currentVerseNumber = verseNumberAtWordIndex(verseMarkers, wordIndex, verse.verseNumber);

  function reportComplete() {
    onVerseAccuracy?.(computeVerseAccuracies(words, verseMarkers, verse.verseNumber, wrongWordIndices, hintedWordIndices));
    onComplete(hadMistakeRef.current, accuracy);
  }

  // A verse the ESV (or another provider) omits entirely comes back as an empty string — e.g.
  // Mark 11:26, a real, documented gap (see lib/bibleProviders/esv.ts), not a rare edge case
  // — which tokenizes to zero words, leaving currentWord permanently undefined. Unlike
  // RhythmRep.tsx/DrawFirstLetterRep.tsx this doesn't render blank (the input/keyboard shell
  // still shows), but every keystroke is a silent no-op forever — the reader has no way to
  // know why nothing is happening. Reports complete straight away instead: there's nothing
  // real to type for a verse the translation itself doesn't print.
  useEffect(() => {
    if (words.length === 0) reportComplete();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fire once per verse, not on every dependency's own identity change
  }, [words.length]);

  function revealCurrentWord() {
    if (!currentWord) return;
    setShowError(false);
    setWrongLetterExpected(null);
    setLetterInput("");
    const nextWordIndex = wordIndex + 1;
    if (nextWordIndex >= words.length) {
      // requirePerfectPass: a pass that picked up any mistake along the way doesn't count as
      // a real rep at all — silently back to word 1, mistakes cleared, and try the whole verse
      // again. Only a genuinely clean pass (wrongWordIndices still empty here) advances.
      if (requirePerfectPass && wrongWordIndices.size > 0) {
        setWrongWordIndices(new Set());
        setWordIndex(0);
        return;
      }
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

  // A mistake restarts this rep's verse reveal from word 1 rather than just retrying it
  // (unless restartOnMistake is off, or requirePerfectPass is on — see FirstLetterTypeRep's
  // own prop doc — either way it just retries the same word instead).
  function recordMistake() {
    hadMistakeRef.current = true;
    setWrongWordIndices((prev) => new Set(prev).add(wordIndex));
    if (restartOnMistake && !requirePerfectPass) setWordIndex(0);
  }

  // The low-priority "Peek Hint" escape valve (see FirstLetterTypeRep's `allowPeekHint`) —
  // deliberately asking for a word's first letter rather than getting it wrong by accident.
  // Same accuracy cost as an actual mistake, but NEVER wipes progress back to word 1, even
  // when restartOnMistake is on: the whole point is an emergency release valve that can't
  // itself create a bigger blockage.
  function peekHint() {
    if (!currentWord) return;
    setShowError(true);
    setWrongLetterExpected(firstWordCharacter(currentWord) ?? "");
    hadMistakeRef.current = true;
    setWrongWordIndices((prev) => new Set(prev).add(wordIndex));
    setHintedWordIndices((prev) => new Set(prev).add(wordIndex));
  }

  function handleLetterChange(value: string) {
    if (!currentWord) return;
    const expected = firstWordCharacter(currentWord)?.toLowerCase();
    const typed = value.toLowerCase();

    if (typed && typed === expected) {
      playCorrectSfx();
      revealCurrentWord();
    } else if (typed) {
      if (!requirePerfectPass) playIncorrectSfx();
      setShowError(true);
      setLetterInput("");
      recordMistake();
    }
  }

  return {
    allWords: words,
    revealedWords: words.slice(0, wordIndex),
    letterInput,
    showError,
    wrongLetterExpected,
    currentWord,
    referenceMatch,
    currentVerseNumber,
    completedReps,
    handleLetterChange,
    revealCurrentWord,
    recordMistake,
    peekHint,
    reportComplete,
  };
}
