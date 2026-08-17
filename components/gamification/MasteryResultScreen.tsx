"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Award, Trophy } from "lucide-react";
import { Confetti } from "@/components/ui/Confetti";
import { TAP_SCALE } from "@/lib/motionTokens";

interface MasteryResultScreenProps {
  cleared: boolean;
  level: number;
  passageLabel: string;
  isFinalLevel: boolean;
  // The title of the sticker just earned for this level clear — null when not cleared, or
  // if resolvePathLabel somehow couldn't build one (shows no sticker line rather than a
  // broken one).
  stickerTitle: string | null;
  onRetry: () => void;
  onNextLevel: () => void;
  onChooseLevel: () => void;
  onChoosePassage: () => void;
}

export function MasteryResultScreen({
  cleared,
  level,
  passageLabel,
  isFinalLevel,
  stickerTitle,
  onRetry,
  onNextLevel,
  onChooseLevel,
  onChoosePassage,
}: MasteryResultScreenProps) {
  const mastered = cleared && isFinalLevel;

  return (
    <div className="relative mx-auto flex w-full max-w-lg flex-col items-center gap-4 overflow-hidden p-8 text-center">
      {mastered && <Confetti />}
      {mastered ? (
        <>
          <Trophy size={40} className="text-brand-500" />
          <h1 className="text-title text-brand-600">Mastered! &quot;{passageLabel}&quot;</h1>
          <p className="text-ink-muted">
            You crossed the Red Sea on Level 5 with almost no room for error — this passage is officially Mastered.
          </p>
        </>
      ) : cleared ? (
        <>
          <h1 className="text-title text-brand-600">Level {level} cleared!</h1>
          <p className="text-ink-muted">&quot;{passageLabel}&quot; — you reached the far shore.</p>
        </>
      ) : (
        <>
          <h1 className="text-title text-heart-600">Caught!</h1>
          <p className="text-ink-muted">
            The chariots caught up on Level {level} of &quot;{passageLabel}&quot;. Give it another run.
          </p>
        </>
      )}
      {stickerTitle && (
        <Link href="/stickers" className="flex items-center gap-2 text-sm text-ink-muted hover:underline">
          <Award size={16} className="text-gold-500" />
          Sticker earned: &quot;{stickerTitle}&quot;
        </Link>
      )}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <motion.button
          type="button"
          whileTap={TAP_SCALE}
          onClick={onRetry}
          className="rounded-full bg-brand-500 px-5 py-2 text-sm font-semibold text-white"
        >
          {cleared ? "Replay this level" : "Try again"}
        </motion.button>
        {cleared && !isFinalLevel && (
          <motion.button
            type="button"
            whileTap={TAP_SCALE}
            onClick={onNextLevel}
            className="rounded-full bg-gold-500 px-5 py-2 text-sm font-semibold text-white"
          >
            Next level
          </motion.button>
        )}
        <button type="button" onClick={onChooseLevel} className="text-sm font-medium text-brand-600 hover:underline">
          Choose a level
        </button>
        <button type="button" onClick={onChoosePassage} className="text-sm font-medium text-ink-muted hover:underline">
          Choose a new passage
        </button>
      </div>
    </div>
  );
}
