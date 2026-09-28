"use client";

import { useRef, useState } from "react";
import type { WordDiffToken } from "@/types";
import { diffAttempt, diffAttemptFirstLetter } from "@/lib/textMatch";
import { levenshteinMatchPercent } from "@/lib/levenshtein";
import { isSecureContextOrLocal, isSpeechRecognitionSupported, requestMicPermission, type SpeechErrorKind } from "@/lib/speechRecognition";
import { useContinuousListening } from "@/lib/useContinuousListening";
import { useSpeakRepReveal } from "@/lib/useSpeakRepReveal";
import { playCorrectSfx, playIncorrectSfx } from "@/lib/audio";

interface UseSpeakRepMicOptions {
  targetText: string;
  reps: number;
  // True for SpeakRep.tsx's own hint-mode stage (first letters shown as scaffolding) — a
  // recognized word counts toward the attempt the instant its own FIRST letter matches the
  // target's, the same leniency lib/useFirstLetterSpeaking.ts's own SRS "Listen" stage already
  // grades by, rather than requiring the whole word (see diffAttemptFirstLetter). Speech
  // recognition regularly mishears a word's own ending/suffix even when the reader said the
  // right word, and this stage's own hint already tells the reader "I only need your first
  // letter" — grading the whole word here would silently hold recitation to a stricter bar than
  // the hint itself promises. False for blind recitation (speak_verse), which keeps the
  // existing whole-word Levenshtein match.
  gradeByFirstLetter?: boolean;
  onComplete: (hadMistake: boolean) => void;
  onMistake?: () => void;
}

// A whole-word recitation passes once its rolling transcript's own Levenshtein similarity to
// the verse (see lib/levenshtein.ts's levenshteinMatchPercent — character-level, punctuation/
// case stripped) reaches this percentage. 87 splits the requested "85 to 90%" range — speech
// transcripts are noisier than typed input (recognition errors, dropped words), so this stays
// well short of requiring an exact match.
const LEVENSHTEIN_MATCH_THRESHOLD = 87;
// A first-letter-graded recitation (see UseSpeakRepMicOptions.gradeByFirstLetter above) passes
// once at least this fraction of the verse's own words had their first letter recognized — the
// same tolerance spirit as LEVENSHTEIN_MATCH_THRESHOLD above, just measured word-by-word instead
// of character-by-character, since diffAttemptFirstLetter's own LCS alignment already isolates
// a single dropped/misheard word rather than needing a fuzzy whole-string percentage to absorb
// it.
const FIRST_LETTER_MATCH_THRESHOLD = 0.87;

// Whether a finished attempt passes under first-letter grading — at least
// FIRST_LETTER_MATCH_THRESHOLD of the verse's own words had their first letter recognized
// somewhere in the right order (see diffAttemptFirstLetter's own LCS alignment).
function passesFirstLetterMatch(transcript: string, target: string): boolean {
  if (!transcript) return false;
  const { verse } = diffAttemptFirstLetter(transcript, target);
  if (verse.length === 0) return true;
  return verse.filter((token) => token.correct).length / verse.length >= FIRST_LETTER_MATCH_THRESHOLD;
}

// The mic/speech-recognition half of SpeakRep.tsx — listening state (via
// lib/useContinuousListening.ts's own Zustand-backed isRecording flag), the live transcript,
// the word-by-word reveal it drives (see lib/useSpeakRepReveal.ts), and the correct/incorrect
// scoring against `targetText` — split out purely to keep that file under this codebase's
// 200-line cap. SpeakRep.tsx itself is just the render.
export function useSpeakRepMic({ targetText, reps, gradeByFirstLetter, onComplete, onMistake }: UseSpeakRepMicOptions) {
  const [completedReps, setCompletedReps] = useState(0);
  const [liveTranscript, setLiveTranscript] = useState("");
  // Fills each word in as it's recognized live — see lib/useSpeakRepReveal.ts.
  const reveal = useSpeakRepReveal(targetText, gradeByFirstLetter ?? false);
  const [mistake, setMistake] = useState<{ spoken: WordDiffToken[]; verse: WordDiffToken[] } | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  // Whether any attempt across this component's lifetime missed — read via ref so it's never stale.
  const hadMistakeRef = useRef(false);
  const supported = isSpeechRecognitionSupported();
  const isSecure = isSecureContextOrLocal();

  const listening = useContinuousListening({
    onTranscript: (transcript) => {
      setLiveTranscript(transcript);
      reveal.onTranscript(transcript);
    },
    onFinalTranscript: (transcript) => {
      const passed = gradeByFirstLetter
        ? passesFirstLetterMatch(transcript, targetText)
        : Boolean(transcript) && levenshteinMatchPercent(transcript, targetText) >= LEVENSHTEIN_MATCH_THRESHOLD;
      if (passed) {
        playCorrectSfx();
        setMistake(null);
        const next = completedReps + 1;
        if (next >= reps) onComplete(hadMistakeRef.current);
        else setCompletedReps(next);
      } else {
        playIncorrectSfx();
        hadMistakeRef.current = true;
        setMistake(gradeByFirstLetter ? diffAttemptFirstLetter(transcript, targetText) : diffAttempt(transcript, targetText));
        onMistake?.();
      }
    },
    onError: (err: SpeechErrorKind) => {
      if (err !== "denied") return;
      setPermissionDenied(true);
    },
  });

  async function handleStart() {
    setMistake(null);
    setLiveTranscript("");
    reveal.reset();

    const perm = await requestMicPermission();
    if (perm === "denied") {
      setPermissionDenied(true);
      return;
    }

    setPermissionDenied(false);
    listening.start();
  }

  return {
    completedReps,
    isListening: listening.isRecording,
    liveTranscript,
    revealedCount: reveal.revealedCount,
    mistake,
    permissionDenied,
    hadMistakeRef,
    supported,
    isSecure,
    handleStart,
    handleStop: listening.stop,
  };
}
