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
// sequence (see lib/learnSteps.ts's versePhases), a quick "hear it before you drill it" pass.
// Distinct from the whole-day Listen that still opens the day as a whole (KineticTextRep.tsx,
// which reads through EVERY verse learned today in one pass before this one ever starts) — the
// two are gated by the same kineticTextStageEnabled setting (Profile > Advanced) since they're
// the same idea at two different scopes. No verseMarkers/context needed, unlike Speak/Type:
// only ever drills exactly one verse's own text, never a joined multi-verse segment. Not
// graded, and never auto-advances on its own — same "self-checked" precedent as
// KineticTextRep/DrawFirstLetterRep.
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

  return (
    <div className="flex flex-col gap-3">
      {layout ? (
        <LessonPageCard layout={layout} activeVerse={verse} renderActiveVerse={() => activeVerseWords} />
      ) : (
        <LessonParchmentCard>
          <p className="mb-1 flex items-center gap-1.5 text-caption font-semibold uppercase tracking-wide text-brand-500">
            Listen <InfoTip text={INFO_TIPS.listenVerseRep} />
          </p>
          <p className="font-serif text-lg leading-loose">{activeVerseWords}</p>
        </LessonParchmentCard>
      )}

      <LessonControlBar dockRef={layout?.dockRef}>
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
