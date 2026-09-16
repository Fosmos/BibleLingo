"use client";

import { motion } from "framer-motion";
import type { VerseSegment } from "@/types";
import { useProgressStore } from "@/store/useProgressStore";
import { useCheckpointField } from "@/lib/useSessionCheckpoint";
import { useCelebration } from "@/lib/useCelebration";
import { TAP_SCALE } from "@/lib/motionTokens";
import { ReviewChain } from "@/components/drills/ReviewChain";
import { SpeakRep } from "@/components/drills/SpeakRep";
import { SectionCompleteOverlay } from "@/components/ui/SectionCompleteOverlay";
import { InfoTip } from "@/components/ui/InfoTip";
import { INFO_TIPS } from "@/lib/infoTipCopy";

interface ChapterReviewStageProps {
  pathKey: string;
  label: string;
  verses: VerseSegment[];
  onComplete: () => void;
  sessionKey?: string;
}

const PHASES = ["words", "speak", "summary"] as const;
type Phase = (typeof PHASES)[number];

// Building view's once-a-day chapter recap (see DailyChapterReviewGate.tsx, its only caller):
// type every word of the chapter learned so far by first letter, then recite it all aloud,
// then a results screen. The day-to-day path's own end-of-chapter review is a plain
// ReviewChain instead (see DaySessionController.tsx) — just the first phase here, with no
// speak-aloud or results screen wrapping it.
export function ChapterReviewStage({ pathKey, label, verses, onComplete, sessionKey }: ChapterReviewStageProps) {
  const [phaseIndex, setPhaseIndex] = useCheckpointField(sessionKey, "phaseIndex", 0);
  const phase: Phase = PHASES[phaseIndex];
  const [accuracy, setAccuracy] = useCheckpointField(sessionKey, "accuracy", 0);
  const recordChapterReviewAccuracy = useProgressStore((state) => state.recordChapterReviewAccuracy);
  const bestAccuracy = useProgressStore((state) => state.chapterReviewBestAccuracy[pathKey] ?? 0);
  const { pending, celebrate, finish } = useCelebration();

  if (pending) {
    return <SectionCompleteOverlay text={pending.text} onDone={finish} />;
  }

  if (phase === "words") {
    return (
      <ReviewChain
        verses={verses}
        onComplete={(wordAccuracy) => {
          setAccuracy(wordAccuracy);
          celebrate(() => setPhaseIndex(1), "Previous chapter reviewed");
        }}
        restartOnMistake={false}
      />
    );
  }

  if (phase === "speak") {
    const fullText = verses.map((verse) => verse.text).join(" ");
    return (
      <SpeakRep
        label="Recite it all"
        reference={label}
        targetText={fullText}
        reps={1}
        onComplete={() => {
          recordChapterReviewAccuracy(pathKey, accuracy);
          celebrate(() => setPhaseIndex(2));
        }}
      />
    );
  }

  const best = Math.max(bestAccuracy, accuracy);
  return (
    <div className="flex flex-col gap-4 text-center">
      <p className="flex items-center justify-center gap-1.5 text-caption font-semibold uppercase tracking-wide text-brand-500">
        Chapter review complete <InfoTip text={INFO_TIPS.chapterReviewStage} />
      </p>
      <p className="text-title">{accuracy}% accuracy</p>
      <p className="text-sm text-ink-muted">Best for {label}: {best}%</p>
      <motion.button
        type="button"
        whileTap={TAP_SCALE}
        onClick={onComplete}
        className="self-center rounded-full bg-brand-500 px-6 py-2 text-sm font-semibold text-white"
      >
        Continue
      </motion.button>
    </div>
  );
}
