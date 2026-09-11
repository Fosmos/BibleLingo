"use client";

import { useEffect, useRef, useState } from "react";
import type { WordDiffToken } from "@/types";
import { diffAttempt, looseMatch } from "@/lib/textMatch";
import { isSecureContextOrLocal, isSpeechRecognitionSupported, requestMicPermission, startListening, type SpeechErrorKind } from "@/lib/speechRecognition";
import { useSpeakRepReveal } from "@/lib/useSpeakRepReveal";
import { playCorrectSfx, playIncorrectSfx } from "@/lib/audio";

interface UseSpeakRepMicOptions {
  targetText: string;
  reps: number;
  onComplete: (hadMistake: boolean) => void;
  onMistake?: () => void;
}

// The mic/speech-recognition half of SpeakRep.tsx — listening state, the live transcript, the
// word-by-word reveal it drives (see lib/useSpeakRepReveal.ts), and the correct/incorrect
// scoring against `targetText` — split out purely to keep that file under this codebase's
// 200-line cap. SpeakRep.tsx itself is just the render.
export function useSpeakRepMic({ targetText, reps, onComplete, onMistake }: UseSpeakRepMicOptions) {
  const [completedReps, setCompletedReps] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");
  // Fills each word in as it's recognized live — see lib/useSpeakRepReveal.ts.
  const reveal = useSpeakRepReveal(targetText);
  const [mistake, setMistake] = useState<{ spoken: WordDiffToken[]; verse: WordDiffToken[] } | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const stopRef = useRef<(() => void) | null>(null);
  // Whether any attempt across this component's lifetime missed — read via ref so it's never stale.
  const hadMistakeRef = useRef(false);
  const supported = isSpeechRecognitionSupported();
  const isSecure = isSecureContextOrLocal();

  useEffect(() => () => stopRef.current?.(), []);

  function handleTranscriptUpdate(transcript: string) {
    setLiveTranscript(transcript);
    reveal.onTranscript(transcript);
  }

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
    setIsListening(true);

    const { transcriptPromise, stop } = startListening(handleTranscriptUpdate, (err: SpeechErrorKind) => {
      if (err !== "denied") return;
      setPermissionDenied(true);
      setIsListening(false);
    });
    stopRef.current = stop;

    transcriptPromise.then((transcript) => {
      setIsListening(false);
      if (transcript && looseMatch(transcript, targetText)) {
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
    });
  }

  function handleStop() {
    stopRef.current?.();
  }

  return {
    completedReps,
    isListening,
    liveTranscript,
    revealedCount: reveal.revealedCount,
    mistake,
    permissionDenied,
    hadMistakeRef,
    supported,
    isSecure,
    handleStart,
    handleStop,
  };
}
