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
  // The immediately preceding learn day's new verses — reviewed on their own, in the same
  // ReviewChain format, before the full-chapter review below (see
  // MemorizationDay.previousVerses). Omitted or empty skips straight to "words".
  previousVerses?: VerseSegment[];
  onComplete: () => void;
  sessionKey?: string;
}

const ALL_PHASES = ["previous", "words", "speak", "summary"] as const;
type Phase = (typeof ALL_PHASES)[number];

export function ChapterReviewStage({
  pathKey,
  label,
  verses,
  previousVerses = [],
  onComplete,
  sessionKey,
}: ChapterReviewStageProps) {
  const phases = previousVerses.length > 0 ? ALL_PHASES : ALL_PHASES.slice(1);
  const [phaseIndex, setPhaseIndex] = useCheckpointField(sessionKey, "phaseIndex", 0);
  const phase: Phase = phases[phaseIndex];
  const [accuracy, setAccuracy] = useCheckpointField(sessionKey, "accuracy", 0);
  const recordChapterReviewAccuracy = useProgressStore((state) => state.recordChapterReviewAccuracy);
  const bestAccuracy = useProgressStore((state) => state.chapterReviewBestAccuracy[pathKey] ?? 0);
  const { pending, celebrate, finish } = useCelebration();

  if (pending) {
    return <SectionCompleteOverlay text={pending.text} onDone={finish} />;
  }

  if (phase === "previous") {
    return (
      <ReviewChain
        verses={previousVerses}
        label="Yesterday's verses"
        onComplete={() => celebrate(() => setPhaseIndex(phaseIndex + 1), "Previous verses reviewed")}
      />
    );
  }

  if (phase === "words") {
    return (
      <ReviewChain
        verses={verses}
        onComplete={(wordAccuracy) => {
          setAccuracy(wordAccuracy);
          celebrate(() => setPhaseIndex(phaseIndex + 1), "Previous chapter reviewed");
        }}
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
          celebrate(() => setPhaseIndex(phaseIndex + 1));
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
