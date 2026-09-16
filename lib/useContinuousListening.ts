"use client";

import { useEffect, useRef } from "react";
import { startListening, type SpeechErrorKind } from "@/lib/speechRecognition";
import { useSpeechRecordingStore } from "@/store/useSpeechRecordingStore";

interface UseContinuousListeningOptions {
  // Fires on every interim AND final speech-recognition result — the rolling transcript so
  // far, exactly as lib/speechRecognition.ts's own startListening already reports it.
  onTranscript: (transcript: string) => void;
  // Fires once, when listening genuinely ends (a real stop() call, or the underlying engine
  // giving up after its own failsafe window — see startListening's own doc comments) — the
  // FINAL transcript to score the attempt against.
  onFinalTranscript: (finalTranscript: string) => void;
  onError?: (errorKind: SpeechErrorKind) => void;
}

export interface ContinuousListening {
  isRecording: boolean;
  start: () => void;
  stop: () => void;
}

// The one shared entry point onto lib/speechRecognition.ts's own startListening — continuous
// listening with interim results, and an onend failsafe that keeps restarting the microphone
// on its own, are already that function's own job (see its own doc comments). This hook's job
// is tying that lifecycle to ONE shared, Zustand-backed `isRecording` flag
// (store/useSpeechRecordingStore.ts) instead of each Speak-family hook keeping its own local
// isListening boolean — any part of the app can read "is the mic live right now" without
// prop-drilling it down from whichever drill started it, and every caller here shares the
// same start/stop contract regardless of which drill is using it.
export function useContinuousListening({ onTranscript, onFinalTranscript, onError }: UseContinuousListeningOptions): ContinuousListening {
  const isRecording = useSpeechRecordingStore((state) => state.isRecording);
  const setRecording = useSpeechRecordingStore((state) => state.setRecording);
  const stopListeningRef = useRef<(() => void) | null>(null);

  // Cancels any in-flight listening session if the component unmounts mid-attempt — otherwise
  // the engine (and isRecording) stay stuck on with nothing left listening for its result.
  useEffect(() => () => stopListeningRef.current?.(), []);

  function start() {
    setRecording(true);
    const { transcriptPromise, stop: stopListening } = startListening(onTranscript, (errorKind) => {
      onError?.(errorKind);
      if (errorKind === "denied" || errorKind === "audio-capture") setRecording(false);
    });
    stopListeningRef.current = stopListening;
    transcriptPromise.then((finalTranscript) => {
      setRecording(false);
      onFinalTranscript(finalTranscript);
    });
  }

  function stop() {
    stopListeningRef.current?.();
    setRecording(false);
  }

  return { isRecording, start, stop };
}
