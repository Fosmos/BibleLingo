"use client";

import { Pause, Play } from "lucide-react";
import { motion } from "framer-motion";
import type { VerseSegment } from "@/types";
import { useKineticTextSync } from "@/lib/useKineticTextSync";
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

// Per-verse Listen: this ONE verse narrated aloud (Web Speech API), each word highlighted in
// real time as it's actually spoken — the automatic FIRST stage of every verse's own drilling
// sequence (see lib/learnSteps.ts's versePhases), a quick "hear it before you drill it" pass,
// gated by kineticTextStageEnabled (Profile > Advanced). No verseMarkers/context needed, unlike
// Speak/Type: only ever drills exactly one verse's own text, never a joined multi-verse
// segment. Not graded, and never auto-advances on its own — same "self-checked" precedent as
// DrawFirstLetterRep.
export function ListenVerseRep({ verse, layout, onComplete }: ListenVerseRepProps) {
  const sync = useKineticTextSync(verse.text);

  const activeVerseWords = (
    <>
      {sync.words.map((wordOffset, index) => (
        <span
          key={index}
          className={
            index === sync.activeWordIndex
              ? "rounded bg-brand-100 text-brand-700 dark:bg-brand-900/50 dark:text-brand-300"
              : index < sync.activeWordIndex
                ? "text-ink-muted dark:text-zinc-600"
                : ""
          }
        >
          {wordOffset.word}{" "}
        </span>
      ))}
    </>
  );

  // Same word-by-word state as activeVerseWords above, sliced to just this ONE clause's own
  // range (see LessonPageCard.tsx's own renderActiveVerse doc comment) — `sync.words` comes
  // from lib/verseWordOffsets.ts's own speech-sync tokenizer (deliberately NOT
  // tokenizeVerseWords — see that file's own doc comment), which can very rarely disagree with
  // tokenizeVerseWords' own word count (a hyphenated word, a bare punctuation-only token) —
  // this stage is never scored, so a clause boundary landing a word off by one on a verse like
  // that is a cosmetic nit, not a functional bug.
  function renderActiveVerseRange(_: VerseSegment, range: SenseLineWordRange) {
    return (
      <>
        {sync.words.slice(range.startIndex, range.endIndex).map((wordOffset, offset) => {
          const index = range.startIndex + offset;
          return (
            <span
              key={index}
              className={
                index === sync.activeWordIndex
                  ? "rounded bg-brand-100 text-brand-700 dark:bg-brand-900/50 dark:text-brand-300"
                  : index < sync.activeWordIndex
                    ? "text-ink-muted dark:text-zinc-600"
                    : ""
              }
            >
              {wordOffset.word}{" "}
            </span>
          );
        })}
      </>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {layout ? (
        <LessonPageCard layout={layout} activeVerse={verse} renderActiveVerse={renderActiveVerseRange} />
      ) : (
        <LessonParchmentCard>
          <p className="mb-1 flex items-center gap-1.5 text-caption font-semibold uppercase tracking-wide text-brand-500">
            Listen <InfoTip text={INFO_TIPS.listenVerseRep} />
          </p>
          <p className="font-serif text-lg leading-loose">{activeVerseWords}</p>
        </LessonParchmentCard>
      )}

      <LessonControlBar dockRef={layout?.dockRef} verseText={verse.text}>
        {/* No caption row above the card in `layout` mode — unmeasured chrome there pushes the
            page past one viewport (useParchmentFillHeight.ts); the InfoTip rides by Continue. */}
        {sync.isSupported ? (
          <button
            type="button"
            onClick={() => (sync.isPlaying ? sync.stop() : sync.play())}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-2xl border border-line bg-mist/40 text-sm font-medium text-ink-soft dark:border-zinc-700 dark:bg-zinc-900/40 dark:text-zinc-300"
          >
            {sync.isPlaying ? <Pause size={16} /> : <Play size={16} />}
            {sync.isPlaying ? "Pause" : sync.activeWordIndex >= 0 ? "Listen again" : "Listen"}
          </button>
        ) : (
          <p className="text-center text-sm text-ink-muted">Read-aloud isn&apos;t available in this browser — read it over yourself, then continue.</p>
        )}
        <div className="flex items-center gap-2">
          <motion.button type="button" whileTap={TAP_SCALE} onClick={onComplete} className="rounded-full bg-brand-500 px-6 py-2 text-sm font-semibold text-white">
            Continue
          </motion.button>
          {layout && <InfoTip text={INFO_TIPS.listenVerseRep} />}
        </div>
        <AutoCompleteButton onClick={onComplete} />
      </LessonControlBar>
    </div>
  );
}
