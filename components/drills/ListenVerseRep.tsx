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
// line follows on its own, then the whole verse together (see lib/useListenRepeat.ts). Not graded:
// Continue is always there.
export function ListenVerseRep({ verse, layout, onComplete }: ListenVerseRepProps) {
  const lr = useListenRepeat(verse.text);
  const current = lr.ranges[lr.clauseIndex];
  const lineCount = lr.lineCount;
  const wholeVerse = lr.clauseIndex >= lineCount;

  function wordClass(index: number): string {
    if (lr.phase === "idle" || lr.phase === "done" || !current || index < current.startIndex) return "";
    if (index >= current.endIndex) return "text-ink-muted/50 dark:text-zinc-600";
    if (lr.phase === "playing") {
      if (index <= lr.narratedWord) return "rounded-md bg-brand-200 text-brand-900 dark:bg-brand-900/50 dark:text-brand-100";
      return "text-ink dark:text-zinc-100";
    }
    return index - current.startIndex < lr.repeatedCount ? "rounded-md bg-brand-200 text-brand-900 dark:bg-brand-900/50 dark:text-brand-100" : "text-brand-700 dark:text-brand-300";
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
    lr.phase === "playing" ? (wholeVerse ? "Listen — now the whole verse" : `Listen — line ${lr.clauseIndex + 1} of ${lineCount}`) :
    wholeVerse && lr.micListening ? "Your turn — say the whole verse" :
    lr.micListening ? "Your turn — say it back" :
    !lr.micBlocked ? "Tap the mic and say it back" :
    lr.micBlocked ? `Say ${wholeVerse ? "the whole verse" : "it"} aloud, then tap Next (${MIC_BLOCKED_REASON[lr.micBlocked]})` :
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
          <div className="flex flex-col font-reading text-lg font-medium leading-loose">
            {lr.ranges.slice(0, lineCount).map((range) => (
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
          <div className="flex w-full items-center gap-2">
            <button type="button" onClick={lr.hearAgain} className={SECONDARY_CLASS}>
              <RotateCcw size={16} /> Hear again
            </button>
            {/* Say the line back to it — tap to listen again (or stop); what's been said is kept. */}
            <motion.button
              type="button"
              whileTap={TAP_SCALE}
              onClick={lr.toggleMic}
              disabled={lr.phase !== "yourTurn" || lr.micBlocked !== null}
              aria-label={lr.micListening ? "Stop listening" : "Say it back"}
              className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-white shadow-[0_4px_0_#8C491A] disabled:opacity-40 ${lr.micListening ? "animate-pulse bg-heart-500" : "bg-brand-500"}`}
            >
              <Mic size={24} strokeWidth={2.5} />
            </motion.button>
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
