"use client";

import { Fragment, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Mic, Square } from "lucide-react";
import type { VerseSegment, WordDiffToken } from "@/types";
import { diffAttempt, looseMatch } from "@/lib/textMatch";
import { isSpeechRecognitionSupported, startListening } from "@/lib/speechRecognition";
import { firstWordCharacter } from "@/lib/verseWords";
import type { FirstLetterHintToken } from "@/lib/verseFirstLetters";
import { playCorrectSfx, playIncorrectSfx } from "@/lib/audio";
import { TAP_SCALE } from "@/lib/motionTokens";
import { MistakeDiff } from "@/components/drills/MistakeDiff";
import { AutoCompleteButton } from "@/components/ui/AutoCompleteButton";
import { InfoTip } from "@/components/ui/InfoTip";
import { INFO_TIPS } from "@/lib/infoTipCopy";
import { VerseContextLine } from "@/components/ui/VerseContextLine";

interface SpeakRepProps {
  label: string;
  reference: string;
  targetText: string;
  reps: number;
  showVerse?: boolean;
  // Shown instead of the full verse when showVerse is false — a first-letters-only token
  // list, for a stage that gives that much of a hint but still requires speaking it all.
  // Tapping (or, on a mouse, hovering) a word's own letter reveals that one word — see
  // lib/verseFirstLetters.ts's firstLetterHintTokens and openWordIndex below (a touch device
  // has no reliable hover state, so the reveal is click-driven, not CSS-hover-only; a mouse
  // still gets the hover affordance for free via the same group/group-hover classes).
  hintTokens?: FirstLetterHintToken[];
  onComplete: (hadMistake: boolean) => void;
  // Fires the instant an attempt is judged wrong, before the retry — callers that need to
  // react to mistakes in real time (e.g. a life-loss counter) can't wait for onComplete,
  // since that only fires once the rep is eventually gotten right.
  onMistake?: () => void;
  // The immediately preceding/following verse, shown directly above/below this verse's own
  // text (or hint) — undefined when there's no neighbor to show.
  previousVerse?: VerseSegment;
  nextVerse?: VerseSegment;
  // When true, a missed attempt's diff shows only each word's first letter instead of the
  // full correct word — used by the Learn flow's closing "speak everything learned today"
  // stage, which shouldn't hand back the answer it's testing.
  firstLettersOnMistake?: boolean;
}

export function SpeakRep({
  label,
  reference,
  targetText,
  reps,
  showVerse,
  hintTokens,
  onComplete,
  onMistake,
  previousVerse,
  nextVerse,
  firstLettersOnMistake,
}: SpeakRepProps) {
  const [completedReps, setCompletedReps] = useState(0);
  // Which hint token (if any) has its word tapped open right now — see hintTokens above.
  const [openWordIndex, setOpenWordIndex] = useState<number | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [mistake, setMistake] = useState<{ spoken: WordDiffToken[]; verse: WordDiffToken[] } | null>(null);
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
        setMistake(diffAttempt(transcript, targetText));
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
      {previousVerse && <VerseContextLine verse={previousVerse} />}
      {showVerse && <p className="text-lg leading-relaxed">{targetText}</p>}
      {!showVerse && hintTokens && hintTokens.length > 0 && (
        <p className="text-lg leading-relaxed tracking-widest text-ink-soft dark:text-zinc-300">
          {hintTokens.map((token, index) => (
            <Fragment key={index}>
              {token.fullWord ? (
                <span className="group relative inline-block">
                  <button
                    type="button"
                    onClick={() => setOpenWordIndex((prev) => (prev === index ? null : index))}
                    className="cursor-help border-b border-dotted border-line dark:border-zinc-600"
                  >
                    {token.display}
                  </button>
                  <span
                    className={`pointer-events-none absolute left-1/2 top-full z-20 mt-1 w-max max-w-[12rem] -translate-x-1/2 rounded-lg border border-line bg-white px-2 py-1 text-xs font-normal normal-case tracking-normal text-ink-soft shadow-sm transition-opacity dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 ${
                      openWordIndex === index ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                    }`}
                  >
                    {token.fullWord}
                  </span>
                </span>
              ) : (
                token.display
              )}
              {token.spaceAfter && " "}
            </Fragment>
          ))}
        </p>
      )}
      {nextVerse && <VerseContextLine verse={nextVerse} />}
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
      {mistake && (
        <MistakeDiff
          spokenLabel="What we heard:"
          spokenTokens={mistake.spoken}
          label={firstLettersOnMistake ? "Correct verse — first letters:" : "Correct verse:"}
          tokens={
            firstLettersOnMistake
              ? mistake.verse.map((token) => ({ ...token, word: firstWordCharacter(token.word) ?? token.word }))
              : mistake.verse
          }
        />
      )}
      <AutoCompleteButton onClick={() => onComplete(hadMistakeRef.current)} />
    </div>
  );
}
