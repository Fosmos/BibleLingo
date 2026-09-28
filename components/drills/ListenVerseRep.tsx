"use client";

import { ArrowRight, Mic, Play, RotateCcw, Volume2 } from "lucide-react";
import { motion } from "framer-motion";
import type { VerseSegment } from "@/types";
import { useListenRepeat, type MicBlocked } from "@/lib/useListenRepeat";
import { TAP_SCALE } from "@/lib/motionTokens";
import { AutoCompleteButton } from "@/components/ui/AutoCompleteButton";
import { InfoTip } from "@/components/ui/InfoTip";
import { INFO_TIPS } from "@/lib/infoTipCopy";
import type { ChapterReadingLayout } from "@/lib/useChapterReadingLayout";
import type { SenseLineWordRange } from "@/lib/senseLineWordRanges";
import { LessonPageCard } from "@/components/gamification/LessonPageCard";
import { LessonParchmentCard } from "@/components/gamification/LessonParchmentCard";
import { LessonControlBar } from "@/components/gamification/LessonControlBar";

interface ListenVerseRepProps {
  verse: VerseSegment;
  // See RhythmRep.tsx's own doc comment on this prop — same "render on the real reading-view
  // page" treatment when set, a plain parchment paragraph when not.
  layout?: ChapterReadingLayout;
  onComplete: () => void;
}

const SECONDARY_CLASS =
  "flex h-10 flex-1 items-center justify-center gap-2 rounded-2xl border border-line bg-mist/40 text-sm font-medium text-ink-soft dark:border-zinc-700 dark:bg-zinc-900/40 dark:text-zinc-300";

// Why the mic isn't listening, shown after "tap Next" — see lib/useListenRepeat.ts's micBlocked.
const MIC_BLOCKED_REASON: Record<MicBlocked, string> = {
  insecure: "mic needs https",
  denied: "mic access is off",
  unsupported: "no speech recognition here",
};

// Listen & Repeat — the automatic FIRST stage of every verse's drilling sequence (see
// lib/learnSteps.ts's versePhases), gated by kineticTextStageEnabled (Profile > Advanced). The
// verse goes line by line (its sense lines): each is read aloud with its words lit as they're
// heard, then the reader says it back, each word lighting green as the mic hears it, and the next
// line follows on its own (see lib/useListenRepeat.ts). Not graded: Continue is always there.
export function ListenVerseRep({ verse, layout, onComplete }: ListenVerseRepProps) {
  const lr = useListenRepeat(verse.text);
  const current = lr.ranges[lr.clauseIndex];
  const lineCount = lr.ranges.length;

  function wordClass(index: number): string {
    if (lr.phase === "idle" || lr.phase === "done" || !current || index < current.startIndex) return "";
    if (index >= current.endIndex) return "text-ink-muted/50 dark:text-zinc-600";
    if (lr.phase === "playing") {
      if (index === lr.narratedWord) return "rounded bg-brand-100 text-brand-700 dark:bg-brand-900/50 dark:text-brand-300";
      return "text-ink dark:text-zinc-100";
    }
    return index - current.startIndex < lr.repeatedCount ? "text-green-700 dark:text-green-400" : "text-brand-700 dark:text-brand-300";
  }

  const renderWords = (start: number, end: number) =>
    lr.words.slice(start, end).map((word, offset) => (
      <span key={start + offset} className={`transition-colors ${wordClass(start + offset)}`}>
        {word}{" "}
      </span>
    ));

  const renderActiveVerseRange = (_: VerseSegment, range: SenseLineWordRange) => <>{renderWords(range.startIndex, range.endIndex)}</>;

  const status =
    lr.phase === "idle" ? "Hear each line, then say it back" :
    lr.phase === "done" ? "Every line heard and repeated" :
    lr.phase === "playing" ? `Listen — line ${lr.clauseIndex + 1} of ${lineCount}` :
    lr.micListening ? "Your turn — say it back" :
    lr.micBlocked ? `Say it aloud, then tap Next (${MIC_BLOCKED_REASON[lr.micBlocked]})` :
    "Your turn — say it aloud, then tap Next";

  return (
    <div className="flex flex-col gap-3">
      {layout ? (
        <LessonPageCard layout={layout} activeVerse={verse} renderActiveVerse={renderActiveVerseRange} />
      ) : (
        <LessonParchmentCard>
          <p className="mb-1 flex items-center gap-1.5 text-caption font-semibold uppercase tracking-wide text-brand-500">
            Listen &amp; Repeat <InfoTip text={INFO_TIPS.listenVerseRep} />
          </p>
          <div className="flex flex-col font-serif text-lg leading-loose">
            {lr.ranges.map((range) => (
              <p key={range.startIndex}>{renderWords(range.startIndex, range.endIndex)}</p>
            ))}
          </div>
        </LessonParchmentCard>
      )}

      <LessonControlBar dockRef={layout?.dockRef} verseText={verse.text}>
        {/* Fixed-height status line, so the controls below never shift as it changes. */}
        <p className="flex h-6 items-center justify-center gap-1.5 text-sm font-medium text-ink-soft dark:text-zinc-300">
          {lr.phase === "playing" && <Volume2 size={15} className="text-brand-500" />}
          {lr.phase === "yourTurn" && lr.micListening && <Mic size={15} className="animate-pulse text-heart-500" />}
          {status}
        </p>
        {lr.phase === "idle" || lr.phase === "done" ? (
          <motion.button type="button" whileTap={TAP_SCALE} onClick={lr.start} className={`${SECONDARY_CLASS} w-full`}>
            {lr.phase === "idle" ? <Play size={16} /> : <RotateCcw size={16} />}
            {lr.phase === "idle" ? "Start" : "Start over"}
          </motion.button>
        ) : (
          <div className="flex w-full gap-2">
            <button type="button" onClick={lr.hearAgain} className={SECONDARY_CLASS}>
              <RotateCcw size={16} /> Hear again
            </button>
            <button type="button" onClick={lr.next} className={SECONDARY_CLASS}>
              Next <ArrowRight size={16} />
            </button>
          </div>
        )}
        <div className="flex items-center gap-2">
          <motion.button type="button" whileTap={TAP_SCALE} onClick={onComplete} className="rounded-full bg-brand-500 px-6 py-2 text-sm font-semibold text-white">
            Continue
          </motion.button>
          {layout && (
            <span className="[.lesson-sheet-controls_&]:hidden">
              <InfoTip text={INFO_TIPS.listenVerseRep} />
            </span>
          )}
        </div>
        <AutoCompleteButton onClick={onComplete} />
      </LessonControlBar>
    </div>
  );
}
