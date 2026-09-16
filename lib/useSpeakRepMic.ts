"use client";

import { useRef, useState } from "react";
import type { WordDiffToken } from "@/types";
import { diffAttempt } from "@/lib/textMatch";
import { levenshteinMatchPercent } from "@/lib/levenshtein";
import { isSecureContextOrLocal, isSpeechRecognitionSupported, requestMicPermission, type SpeechErrorKind } from "@/lib/speechRecognition";
import { useContinuousListening } from "@/lib/useContinuousListening";
import { useSpeakRepReveal } from "@/lib/useSpeakRepReveal";
import { playCorrectSfx, playIncorrectSfx } from "@/lib/audio";

interface UseSpeakRepMicOptions {
  targetText: string;
  reps: number;
  onComplete: (hadMistake: boolean) => void;
  onMistake?: () => void;
}

// A recitation passes once its rolling transcript's own Levenshtein similarity to the verse
// (see lib/levenshtein.ts's levenshteinMatchPercent — character-level, punctuation/case
// stripped) reaches this percentage. 87 splits the requested "85 to 90%" range — speech
// transcripts are noisier than typed input (recognition errors, dropped words), so this stays
// well short of requiring an exact match.
const LEVENSHTEIN_MATCH_THRESHOLD = 87;

// The mic/speech-recognition half of SpeakRep.tsx — listening state (via
// lib/useContinuousListening.ts's own Zustand-backed isRecording flag), the live transcript,
// the word-by-word reveal it drives (see lib/useSpeakRepReveal.ts), and the correct/incorrect
// scoring against `targetText` — split out purely to keep that file under this codebase's
// 200-line cap. SpeakRep.tsx itself is just the render.
export function useSpeakRepMic({ targetText, reps, onComplete, onMistake }: UseSpeakRepMicOptions) {
  const [completedReps, setCompletedReps] = useState(0);
  const [liveTranscript, setLiveTranscript] = useState("");
  // Fills each word in as it's recognized live — see lib/useSpeakRepReveal.ts.
  const reveal = useSpeakRepReveal(targetText);
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
      if (transcript && levenshteinMatchPercent(transcript, targetText) >= LEVENSHTEIN_MATCH_THRESHOLD) {
        playCorrectSfx();
        setMistake(null);
        const next = completedReps + 1;
        if (next >= reps) onComplete(hadMistakeRef.current);
        else setCompletedReps(next);
      } else {
        playIncorrectSfx();
        hadMistakeRef.current = true;
        setMistake(diffAttempt(transcript, targetText));
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
