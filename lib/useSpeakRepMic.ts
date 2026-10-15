"use client";

import { useRef, useState } from "react";
import type { WordDiffToken } from "@/types";
import { isSecureContextOrLocal, isSpeechRecognitionSupported, requestMicPermission, type SpeechErrorKind } from "@/lib/speechRecognition";
import { useContinuousListening } from "@/lib/useContinuousListening";
import { useSpeakRepReveal } from "@/lib/useSpeakRepReveal";
import { playCorrectSfx } from "@/lib/audio";

interface UseSpeakRepMicOptions {
  targetText: string;
  reps: number;
  onComplete: (hadMistake: boolean) => void;
}

// The mic/speech-recognition half of SpeakRep.tsx — listening state (via
// lib/useContinuousListening.ts's own Zustand-backed isRecording flag), the live transcript and
// the word-by-word reveal it drives (see lib/useSpeakRepReveal.ts). Nothing resets on a missed
// word: each word fills in once its first letter is heard, stopping and listening again carries
// on from there, and the rep is done the moment the last word is heard. Split out purely to keep
// SpeakRep.tsx under this codebase's 200-line cap; that file is just the render.
export function useSpeakRepMic({ targetText, reps, onComplete }: UseSpeakRepMicOptions) {
  const [completedReps, setCompletedReps] = useState(0);
  const [liveTranscript, setLiveTranscript] = useState("");
  // Fills each word in as it's recognized live — see lib/useSpeakRepReveal.ts. Always by first
  // letter: the stage waits for the next word's first letter rather than grading a whole attempt.
  const reveal = useSpeakRepReveal(targetText, true);
  // Never set any more — a missed word just waits to be said (kept for SpeakRep.tsx's mistake view).
  const mistake = null as { spoken: WordDiffToken[]; verse: WordDiffToken[] } | null;
  const [permissionDenied, setPermissionDenied] = useState(false);
  const hadMistakeRef = useRef(false);
  const doneRef = useRef(false);
  const supported = isSpeechRecognitionSupported();
  const isSecure = isSecureContextOrLocal();

  // Every word heard: a rep done — the next starts fresh, the last completes the stage.
  function finishRep() {
    if (doneRef.current) return;
    doneRef.current = true;
    playCorrectSfx();
    const next = completedReps + 1;
    if (next >= reps) return onComplete(hadMistakeRef.current);
    setCompletedReps(next);
    reveal.reset();
    setLiveTranscript("");
    doneRef.current = false;
  }

  const listening = useContinuousListening({
    onTranscript: (transcript) => {
      setLiveTranscript(transcript);
      if (reveal.onTranscript(transcript) < reveal.total) return;
      listening.stop();
      finishRep();
    },
    // Stopped before the end: what was said is kept, and the next listen carries on from it.
    onFinalTranscript: () => {
      if (reveal.total > 0 && reveal.revealedCount >= reveal.total) finishRep();
    },
    onError: (err: SpeechErrorKind) => {
      if (err !== "denied") return;
      setPermissionDenied(true);
    },
  });

  async function handleStart() {
    setLiveTranscript("");
    reveal.resume();

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
