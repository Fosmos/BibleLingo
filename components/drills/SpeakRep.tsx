"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Mic, Square } from "lucide-react";
import type { WordDiffToken } from "@/types";
import { diffWords, looseMatch } from "@/lib/textMatch";
import { isSpeechRecognitionSupported, startListening } from "@/lib/speechRecognition";
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
  // Fires the instant an attempt is judged wrong, before the retry — callers that need to
  // react to mistakes in real time (e.g. a life-loss counter) can't wait for onComplete,
  // since that only fires once the rep is eventually gotten right.
  onMistake?: () => void;
}

export function SpeakRep({ label, reference, targetText, reps, showVerse, onComplete, onMistake }: SpeakRepProps) {
  const [completedReps, setCompletedReps] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [mistake, setMistake] = useState<WordDiffToken[] | null>(null);
  const stopRef = useRef<(() => void) | null>(null);
  // Tracks whether any attempt across this component's lifetime (all reps) missed —
  // read synchronously via ref rather than state so the value reported to onComplete on
  // the very next successful attempt is never stale.
  const hadMistakeRef = useRef(false);
  const supported = isSpeechRecognitionSupported();

  function handleStart() {
    setMistake(null);
    setLiveTranscript("");
    setIsListening(true);
    const { transcriptPromise, stop } = startListening(setLiveTranscript);
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
      {!supported && (
        <p className="text-sm text-ink-muted">
          Speech recognition isn&apos;t supported in this browser — try Chrome or Edge.
        </p>
      )}
      {!isListening ? (
        <motion.button
          type="button"
          disabled={!supported}
          whileTap={supported ? TAP_SCALE : undefined}
          onClick={handleStart}
          aria-label="Start speaking"
          className="flex h-16 w-16 items-center justify-center self-start rounded-full bg-brand-500 text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Mic size={26} />
        </motion.button>
      ) : (
        <motion.button
          type="button"
          whileTap={TAP_SCALE}
          onClick={handleStop}
          aria-label="Done speaking"
          className="flex h-16 w-16 items-center justify-center self-start rounded-full bg-heart-500 text-white"
        >
          <Square size={22} />
        </motion.button>
      )}
      {isListening && (
        <p className="min-h-6 text-lg leading-relaxed text-ink-soft dark:text-zinc-300">
          {liveTranscript || <span className="text-ink-muted">Listening — take your time...</span>}
        </p>
      )}
      {mistake && <MistakeDiff label="Not quite what we heard — here's the correct verse:" tokens={mistake} />}
      <AutoCompleteButton onClick={() => onComplete(hadMistakeRef.current)} />
    </div>
  );
}
