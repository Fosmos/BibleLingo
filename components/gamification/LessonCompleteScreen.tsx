"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Coins, Flame } from "lucide-react";
import { useProgressStore } from "@/store/useProgressStore";
import { TAP_SCALE } from "@/lib/motionTokens";

interface LessonCompleteScreenProps {
  heading: string;
  // Shekels this session earned — shown as a "+N" chip when above zero.
  shekelsEarned: number;
  continueLabel: string;
  // Continue by callback (an in-place session) or by link (the standalone day route).
  onContinue?: () => void;
  continueHref: string;
}

// A finished day's closing screen (the Organic restyle): a sage check, the heading, a streak chip
// and the shekels earned, then the way back plus a quiet "Go Home".
export function LessonCompleteScreen({ heading, shekelsEarned, continueLabel, onContinue, continueHref }: LessonCompleteScreenProps) {
  const streak = useProgressStore((state) => state.streak.currentStreak);
  const primaryClass =
    "flex w-full items-center justify-center rounded-full bg-brand-500 py-3.5 text-base font-semibold text-paper transition-colors hover:bg-brand-600 active:bg-brand-700";

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-4 px-6 py-10 text-center">
      <motion.span
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-sage-600 text-white"
      >
        <Check size={24} strokeWidth={3} />
      </motion.span>
      <h1 className="text-xl leading-tight text-ink dark:text-zinc-100">{heading}</h1>
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1 rounded-full bg-brand-100 px-3 py-1.5 text-sm font-bold text-brand-700 dark:bg-zinc-800 dark:text-brand-300">
          <Flame size={16} strokeWidth={2.75} className="fill-brand-400" /> {streak}
        </span>
        {shekelsEarned > 0 && (
          <span className="flex items-center gap-1 rounded-full bg-sand-100 px-3 py-1.5 text-sm font-bold text-ink-soft dark:bg-zinc-800 dark:text-zinc-300">
            <Coins size={16} strokeWidth={2.75} className="text-brand-600" /> +{shekelsEarned}
          </span>
        )}
      </div>
      <div className="mt-2 flex w-full flex-col gap-1">
        {onContinue ? (
          <motion.button type="button" whileTap={TAP_SCALE} onClick={onContinue} className={primaryClass}>
            {continueLabel}
          </motion.button>
        ) : (
          <Link href={continueHref} className={primaryClass}>
            {continueLabel}
          </Link>
        )}
        <Link href="/" className="py-3 text-[15px] font-semibold text-brand-700 hover:underline dark:text-brand-300">
          Go Home
        </Link>
      </div>
    </div>
  );
}
