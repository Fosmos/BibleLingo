"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Mic, Square, MicOff, ArrowRight, RotateCw } from "lucide-react";
import type { WordDiffToken } from "@/types";
import { diffWords, looseMatch } from "@/lib/textMatch";
import {
  isSecureContextOrLocal,
  isSpeechRecognitionSupported,
  requestMicPermission,
  startListening,
  type SpeechErrorKind,
} from "@/lib/speechRecognition";
import { playCorrectSfx, playIncorrectSfx } from "@/lib/audio";
import { TAP_SCALE } from "@/lib/motionTokens";
import { MistakeDiff } from "@/components/drills/MistakeDiff";
import { AutoCompleteButton } from "@/components/ui/AutoCompleteButton";
import { InfoTip } from "@/components/ui/InfoTip";
import { INFO_TIPS } from "@/lib/infoTipCopy";

interface SpeakRepProps {
  label: string;
  reference: string;
  targetText: string;
  reps: number;
  showVerse?: boolean;
  onComplete: (hadMistake: boolean) => void;
  onMistake?: () => void;
}

export function SpeakRep({ label, reference, targetText, reps, showVerse, onComplete, onMistake }: SpeakRepProps) {
  const [completedReps, setCompletedReps] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [mistake, setMistake] = useState<WordDiffToken[] | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const stopRef = useRef<(() => void) | null>(null);
  const hadMistakeRef = useRef(false);
  const supported = isSpeechRecognitionSupported();
  const isSecure = isSecureContextOrLocal();

  useEffect(() => {
    return () => {
      stopRef.current?.();
    };
  }, []);

  async function handleStart() {
    setMistake(null);
    setLiveTranscript("");

    const perm = await requestMicPermission();
    if (perm === "denied") {
      setPermissionDenied(true);
      return;
    }

    setPermissionDenied(false);
    setIsListening(true);

    const { transcriptPromise, stop } = startListening(setLiveTranscript, (err: SpeechErrorKind) => {
      if (err === "denied") {
        setPermissionDenied(true);
        setIsListening(false);
      }
    });
    stopRef.current = stop;

    transcriptPromise.then((transcript) => {
      setIsListening(false);
      if (transcript && looseMatch(transcript, targetText)) {
        playCorrectSfx();
        setMistake(null);
        const next = completedReps + 1;
        if (next >= reps) {
          onComplete(hadMistakeRef.current);
        } else {
          setCompletedReps(next);
        }
      } else {
        playIncorrectSfx();
        hadMistakeRef.current = true;
        setMistake(diffWords(transcript, targetText));
        onMistake?.();
      }
    });
  }

  function handleStop() {
    stopRef.current?.();
  }

  const showFallback = !supported || permissionDenied || !isSecure;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="flex items-center gap-1.5 text-caption font-semibold uppercase tracking-wide text-brand-500">
          {label} <InfoTip text={INFO_TIPS.speakRep} />
        </p>
        <p className="text-title">{reference}</p>
      </div>
      <p className="text-sm text-ink-muted">
        Rep {completedReps + 1} of {reps}
      </p>
      {showVerse && <p className="text-lg leading-relaxed">{targetText}</p>}

      {/* no mic access */}
      {showFallback ? (
        <div className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
          <div className="flex items-center gap-2 font-medium">
            <MicOff size={18} className="text-amber-600 dark:text-amber-400" />
            <span>
              {!isSecure
                ? "HTTPS required on mobile"
                : permissionDenied
                  ? "Microphone access declined"
                  : "Speech recognition unsupported"}
            </span>
          </div>
          <p className="text-sm text-ink-muted dark:text-zinc-400">
            {!isSecure
              ? "Mobile browsers (iOS Safari & Android Chrome) only allow microphone access over HTTPS. When testing locally on a phone, launch the server with npm run dev:https."
              : permissionDenied
                ? "Microphone access was declined in your browser. Speaking exercises can't record your voice without microphone permission."
                : "Speech recognition isn't supported in this browser (try Chrome, Edge, or Safari on iOS/Android)."}
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <motion.button
              type="button"
              whileTap={TAP_SCALE}
              onClick={() => onComplete(hadMistakeRef.current)}
              className="inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
            >
              <span>Go to next exercise</span>
              <ArrowRight size={16} />
            </motion.button>
            {supported && isSecure && permissionDenied && (
              <motion.button
                type="button"
                whileTap={TAP_SCALE}
                onClick={handleStart}
                className="inline-flex items-center gap-1.5 rounded-full border border-ink-muted/30 px-4 py-2 text-sm font-medium text-ink-soft hover:bg-ink-muted/10 dark:text-zinc-300"
              >
                <RotateCw size={15} />
                <span>Try microphone again</span>
              </motion.button>
            )}
          </div>
        </div>
      // Mic access
      ) : (
        <>
          {!isListening ? (
            <div className="flex items-center gap-3">
              <motion.button
                type="button"
                whileTap={TAP_SCALE}
                onClick={handleStart}
                aria-label="Start speaking"
                className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-500 text-white shadow-sm hover:bg-brand-600"
              >
                <Mic size={26} />
              </motion.button>
              <span className="text-sm text-ink-muted">Tap to allow mic & recite</span>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <motion.button
                type="button"
                whileTap={TAP_SCALE}
                onClick={handleStop}
                aria-label="Done speaking"
                className="flex h-16 w-16 items-center justify-center rounded-full bg-heart-500 text-white shadow-sm animate-pulse"
              >
                <Square size={22} />
              </motion.button>
              <span className="text-sm text-ink-muted">Tap when finished reciting</span>
            </div>
          )}

          {isListening && (
            <p className="min-h-6 text-lg leading-relaxed text-ink-soft dark:text-zinc-300">
              {liveTranscript || <span className="text-ink-muted">Listening — recite at your own pace...</span>}
            </p>
          )}
        </>
      )}

      {mistake && <MistakeDiff label="Not quite what we heard — here's the correct verse:" tokens={mistake} />}
      <AutoCompleteButton onClick={() => onComplete(hadMistakeRef.current)} />
    </div>
  );
}
