"use client";

import { useEffect, useRef, useState } from "react";
import type { VerseSegment } from "@/types";
import { diffAttemptFirstLetter } from "@/lib/textMatch";
import { isSecureContextOrLocal, isSpeechRecognitionSupported, requestMicPermission, startListening, type SpeechErrorKind } from "@/lib/speechRecognition";
import { tokenizeVerseWords } from "@/lib/verseWords";
import { computeVerseAccuracies, type VerseAccuracy } from "@/lib/verseAccuracyBreakdown";
import { verseNumberAtWordIndex } from "@/lib/verseBatching";
import { playCorrectSfx } from "@/lib/audio";
import { hapticTick } from "@/lib/haptics";

interface UseFirstLetterSpeakingOptions {
  verse: VerseSegment;
  verseMarkers?: Record<number, number>;
  onComplete: (hadMistake: boolean, accuracy: number) => void;
  onVerseAccuracy?: (results: VerseAccuracy[]) => void;
}

export interface FirstLetterSpeaking {
  words: string[];
  wordIndex: number;
  revealedWords: string[];
  currentVerseNumber: number;
  isListening: boolean;
  liveTranscript: string;
  supported: boolean;
  isSecure: boolean;
  permissionDenied: boolean;
  start: () => void;
  stop: () => void;
}

function normalizeWord(word: string): string {
  return word.toLowerCase().replace(/[^\w]/g, "");
}

// This is a first-letter recall check, not a verbatim recitation one — a spoken word counts
// toward `expected` the instant its own FIRST letter matches, regardless of anything said after
// it. Speech recognition is noisy enough (misheard endings, dropped suffixes) that requiring the
// whole word would fail attempts a reader actually got right.
function firstLetterOf(word: string): string {
  return normalizeWord(word).charAt(0);
}

// How many of `expected`'s own first letters (in order, from its own start) already appear — in
// order, allowing any number of extra/misheard filler words between them — somewhere in
// `transcriptLetters`. Recomputed from scratch on every interim transcript update rather than
// tracked incrementally: an interim result is the WHOLE utterance-so-far re-guessed, not an
// append-only stream (see lib/speechRecognition.ts's own onresult handling), so yesterday's
// partial match can't just be extended — but re-scanning a verse-length word list on every
// tick is cheap enough that this is simpler and more robust than trying to diff two interim
// guesses against each other.
function countMatchedPrefix(transcriptLetters: string[], expected: string[]): number {
  let t = 0;
  let matched = 0;
  for (const letter of expected) {
    let found = false;
    for (; t < transcriptLetters.length; t++) {
      if (transcriptLetters[t] === letter) {
        t++;
        found = true;
        break;
      }
    }
    if (!found) break;
    matched++;
  }
  return matched;
}

// The speech-driven counterpart to lib/useFirstLetterTyping.ts, used by SRS review's own
// speak-mode toggle (see SrsEntityRecall.tsx) — same progressive reveal-by-word UX as typing,
// but triggered by actually SAYING each word instead of tapping its first letter. Live reveal
// (wordIndex, driven by countMatchedPrefix above) is best-effort and forgiving — real-time
// speech recognition is far noisier than a keystroke, so it only ever drives what's shown
// WHILE the reader is speaking, never the actual score. Final accuracy instead comes from
// lib/textMatch.ts's diffAttempt — the same LCS word-alignment SpeakRep.tsx already relies on
// — run once against the finished transcript, so one dropped or misheard word only ever costs
// that one word rather than throwing off everything said after it. Listening auto-stops (and
// scores) the instant every word's been heard, so a clean recitation never needs a manual
// "Done" tap at all.
export function useFirstLetterSpeaking({ verse, verseMarkers, onComplete, onVerseAccuracy }: UseFirstLetterSpeakingOptions): FirstLetterSpeaking {
  const words = tokenizeVerseWords(verse.text);
  const expectedFirstLetters = words.map(firstLetterOf);
  const [liveMatched, setLiveMatched] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [permissionDenied, setPermissionDenied] = useState(false);
  const stopRef = useRef<(() => void) | null>(null);
  const finishedRef = useRef(false);

  useEffect(() => {
    return () => {
      stopRef.current?.();
    };
  }, []);

  const wordIndex = Math.min(liveMatched, words.length);
  const currentVerseNumber = verseNumberAtWordIndex(verseMarkers, wordIndex, verse.verseNumber);

  function finalize(finalTranscript: string) {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setIsListening(false);
    const { verse: diffVerse } = diffAttemptFirstLetter(finalTranscript, verse.text);
    const wrongWordIndices = new Set<number>();
    diffVerse.forEach((token, index) => {
      if (!token.correct) wrongWordIndices.add(index);
    });
    onVerseAccuracy?.(computeVerseAccuracies(words, verseMarkers, verse.verseNumber, wrongWordIndices));
    const accuracy = words.length > 0 ? Math.round(((words.length - wrongWordIndices.size) / words.length) * 100) : 100;
    onComplete(wrongWordIndices.size > 0, accuracy);
  }

  function stop() {
    stopRef.current?.();
  }

  // Every word heard — wait a beat, then stop listening and score, instead of waiting for a
  // manual tap (which a reader who recited cleanly would never think to make) or cutting off
  // the instant the last word lands (speech recognition's own final result for that last word
  // can still arrive a moment after the live match already counted it). The effect's own
  // cleanup cancels the pending finish if `isListening`/`wordIndex` change again before it
  // fires — a real stop()/unmount, or (impossible today since liveMatched only ever grows, but
  // harmless either way) the match count dropping back below the last word.
  useEffect(() => {
    if (!isListening || wordIndex < words.length || words.length === 0) return;
    const timer = setTimeout(stop, 2000);
    return () => clearTimeout(timer);
  }, [isListening, wordIndex, words.length]);

  function start() {
    finishedRef.current = false;
    setLiveMatched(0);
    setLiveTranscript("");

    requestMicPermission().then((perm) => {
      if (perm === "denied") {
        setPermissionDenied(true);
        return;
      }
      setPermissionDenied(false);
      setIsListening(true);
      const { transcriptPromise, stop: stopListening } = startListening(
        (transcript) => {
          setLiveTranscript(transcript);
          const transcriptLetters = transcript.split(/\s+/).filter(Boolean).map(firstLetterOf);
          const matched = countMatchedPrefix(transcriptLetters, expectedFirstLetters);
          setLiveMatched((prev) => {
            if (matched > prev) {
              playCorrectSfx();
              hapticTick();
            }
            return Math.max(prev, matched);
          });
        },
        (err: SpeechErrorKind) => {
          if (err === "denied") {
            setPermissionDenied(true);
            setIsListening(false);
          }
        },
      );
      stopRef.current = stopListening;
      transcriptPromise.then(finalize);
    });
  }

  return {
    words,
    wordIndex,
    revealedWords: words.slice(0, wordIndex),
    currentVerseNumber,
    isListening,
    liveTranscript,
    supported: isSpeechRecognitionSupported(),
    isSecure: isSecureContextOrLocal(),
    permissionDenied,
    start,
    stop,
  };
}
