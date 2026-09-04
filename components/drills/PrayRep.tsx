"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { VerseSegment } from "@/types";
import { tokenizeVerseWords } from "@/lib/verseWords";
import { TAP_SCALE } from "@/lib/motionTokens";
import { playCorrectSfx } from "@/lib/audio";
import type { WordAnnotationMap } from "@/lib/verseHighlights";
import { AnnotatedVerseWord } from "@/components/drills/AnnotatedVerseWord";
import { VerseNumberMarker } from "@/components/drills/VerseNumberMarker";
import { AutoCompleteButton } from "@/components/ui/AutoCompleteButton";
import { InfoTip } from "@/components/ui/InfoTip";
import { INFO_TIPS } from "@/lib/infoTipCopy";
import { VerseContextLine } from "@/components/ui/VerseContextLine";
import { VerseReferenceHeader } from "@/components/ui/VerseReferenceHeader";
import { VerseTextLine } from "@/components/ui/VerseTextLine";

interface PrayRepProps {
  verse: VerseSegment;
  verseMarkers: Record<number, number>;
  annotations: WordAnnotationMap;
  onComplete: () => void;
  previousVerse?: VerseSegment;
  nextVerse?: VerseSegment;
  // How long the timer runs — see LearnSection.tsx's buildSteps: 60 on a day with more than 3
  // new verses, 30 otherwise.
  durationSeconds?: number;
}

const DEFAULT_PRAYER_DURATION_S = 30;

function formatDuration(totalSeconds: number): string {
  if (totalSeconds % 60 === 0) {
    const mins = totalSeconds / 60;
    return `${mins} minute${mins === 1 ? "" : "s"}`;
  }
  return `${totalSeconds} seconds`;
}

// The lesson's closing stage: a guided pause to sit with the verse(s) and pray before the
// lesson hands off to whatever review follows — no drilling, no grading. Starting the timer
// counts down for real (setInterval, not just a visual cue); Continue stays disabled until it
// finishes.
export function PrayRep({
  verse,
  verseMarkers,
  annotations,
  onComplete,
  previousVerse,
  nextVerse,
  durationSeconds = DEFAULT_PRAYER_DURATION_S,
}: PrayRepProps) {
  const words = tokenizeVerseWords(verse.text);
  const [secondsLeft, setSecondsLeft] = useState(durationSeconds);
  const durationLabel = formatDuration(durationSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  function handleStart() {
    setIsRunning(true);
    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setIsRunning(false);
          setIsDone(true);
          playCorrectSfx();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const progress = (durationSeconds - secondsLeft) / durationSeconds;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="flex items-center gap-1.5 text-caption font-semibold uppercase tracking-wide text-brand-500">
          Remember <InfoTip text={INFO_TIPS.prayRep} />
        </p>
        <VerseReferenceHeader book={verse.book} chapter={verse.chapter} verseNumber={verse.verseNumber} />
      </div>
      {previousVerse && <VerseContextLine verse={previousVerse} />}
      <p className="flex flex-wrap items-baseline gap-x-1.5 gap-y-2 text-lg leading-relaxed">
        <VerseTextLine chapter={verse.chapter} verseNumber={verse.verseNumber} />
        {words.map((word, index) => (
          <Fragment key={index}>
            {verseMarkers[index] && (
              <>
                <span className="basis-full" />
                <VerseNumberMarker number={verseMarkers[index]} />
              </>
            )}
            <AnnotatedVerseWord word={word} annotation={annotations[index]} />
          </Fragment>
        ))}
      </p>
      {nextVerse && <VerseContextLine verse={nextVerse} />}
      <p className="text-sm font-medium text-ink-soft dark:text-zinc-300">
        Take {durationLabel} to pray about this verse — what it means, and how you want to respond to it.
      </p>
      <div className="flex flex-col items-center gap-4 py-4">
        <span className="text-2xl font-semibold tabular-nums text-ink dark:text-zinc-100">
          {minutes}:{seconds.toString().padStart(2, "0")}
        </span>
        <div className="relative h-3 w-48 overflow-hidden rounded-full bg-mist dark:bg-zinc-800">
          <motion.div
            className="absolute inset-y-0 left-0 bg-brand-500"
            animate={{ width: `${progress * 100}%` }}
            transition={{ duration: isRunning ? 1 : 0, ease: "linear" }}
          />
        </div>
        {!isRunning && !isDone && (
          <motion.button
            type="button"
            whileTap={TAP_SCALE}
            onClick={handleStart}
            className="rounded-full bg-brand-500 px-6 py-2 text-sm font-semibold text-white"
          >
            Start prayer timer ({durationLabel})
          </motion.button>
        )}
        {isRunning && <p className="text-sm text-ink-muted">Praying…</p>}
        {isDone && <p className="text-sm font-medium text-brand-600 dark:text-brand-400">Amen.</p>}
      </div>
      <div className="flex items-center gap-4">
        <motion.button
          type="button"
          whileTap={TAP_SCALE}
          disabled={!isDone}
          onClick={onComplete}
          className="rounded-full bg-brand-500 px-6 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          Continue
        </motion.button>
      </div>
      <AutoCompleteButton onClick={onComplete} />
    </div>
  );
}
