"use client";

import { useMemo } from "react";
import { Pause, Play } from "lucide-react";
import { motion } from "framer-motion";
import type { VerseSegment } from "@/types";
import { useKineticTextSync } from "@/lib/useKineticTextSync";
import { tokenizeWithOffsets } from "@/lib/verseWordOffsets";
import { TAP_SCALE } from "@/lib/motionTokens";
import { AutoCompleteButton } from "@/components/ui/AutoCompleteButton";
import { InfoTip } from "@/components/ui/InfoTip";
import { INFO_TIPS } from "@/lib/infoTipCopy";
import type { ChapterReadingLayout } from "@/lib/useChapterReadingLayout";
import { LessonWholeDayPageCard } from "@/components/gamification/LessonWholeDayPageCard";
import { LessonControlBar } from "@/components/gamification/LessonControlBar";

interface KineticTextRepProps {
  // Today's own real verses (see LearnSection.tsx's `realVerses`) — every one of them renders
  // in full on the SAME real reading-view page as the rest of the Learn flow (see
  // LessonWholeDayPageCard.tsx), highlighted word by word as it's actually spoken.
  verses: VerseSegment[];
  onComplete: () => void;
  layout: ChapterReadingLayout;
}

// The "Listen" stage: the whole day's text narrated aloud (Web Speech API) with each word
// highlighted in real time as it's actually spoken — a synced read-along pass before drilling
// into individual verses. On by default (see ProfileAdvancedSettings.tsx); sits right after
// Visualize, before the first verse's own per-verse stages (see lib/learnSteps.ts). Not
// graded, and never auto-advances on its own even once narration finishes — same
// "self-checked" precedent as VerseOrientationSummaryRep — so a reader who wants to listen
// again before moving on always can.
export function KineticTextRep({ verses, onComplete, layout }: KineticTextRepProps) {
  const wholeDayText = useMemo(() => verses.map((verse) => verse.text).join(" "), [verses]);
  const sync = useKineticTextSync(wholeDayText);
  // useKineticTextSync's own word list is tokenized straight off character offsets into
  // `wholeDayText` (see lib/verseWordOffsets.ts) — deliberately NOT the same tokenizer
  // LearnSection.tsx's own `verseOffsets` counts against (that one drops punctuation-only
  // tokens for typing/scoring drills) — so this verse's own slice into `sync.words` needs its
  // OWN offsets, counted the identical way, rather than reusing that other array.
  const verseWordCounts = useMemo(() => verses.map((verse) => tokenizeWithOffsets(verse.text).length), [verses]);
  const verseWordOffsets = useMemo(() => {
    const offsets: number[] = [];
    for (let i = 0; i < verseWordCounts.length; i++) offsets.push((offsets[i - 1] ?? 0) + (verseWordCounts[i - 1] ?? 0));
    return offsets;
  }, [verseWordCounts]);

  return (
    <div className="flex flex-col gap-3">
      <LessonWholeDayPageCard
        layout={layout}
        verses={verses}
        renderActiveVerse={(verse, verseIndex) => {
          const offset = verseWordOffsets[verseIndex] ?? 0;
          const count = verseWordCounts[verseIndex] ?? 0;
          const localWords = sync.words.slice(offset, offset + count);
          return (
            <>
              {localWords.map((wordOffset, i) => {
                const globalIndex = offset + i;
                return (
                  <span
                    key={i}
                    className={
                      globalIndex === sync.activeWordIndex
                        ? "rounded bg-brand-100 text-brand-700 dark:bg-brand-900/50 dark:text-brand-300"
                        : globalIndex < sync.activeWordIndex
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
        }}
      />

      <LessonControlBar dockRef={layout.dockRef}>
        {/* No caption row above the card — anything between bodyTopRef and the card is
            unmeasured chrome that pushes the page past one viewport (useParchmentFillHeight.ts).
            The InfoTip rides next to the play button instead. */}
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
          <InfoTip text={INFO_TIPS.kineticTextRep} />
        </div>
        <AutoCompleteButton onClick={onComplete} />
      </LessonControlBar>
    </div>
  );
}
