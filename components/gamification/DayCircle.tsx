"use client";

import { motion } from "framer-motion";
import { Lock, Check, BookOpen, Swords, GraduationCap, Repeat, History } from "lucide-react";
import type { MemorizationDay } from "@/types";
import { formatVerseRangeLabel } from "@/lib/chapterContent";
import { MOTION_DURATION, TAP_SCALE } from "@/lib/motionTokens";

export function dayLabel(day: MemorizationDay): string {
  if (day.kind === "learn") {
    if (day.newVerses.length > 1) return formatVerseRangeLabel(day.newVerses);
    return day.newVerses[0]?.reference ?? `Lesson ${day.dayNumber}`;
  }
  if (day.kind === "chapter_review") return "Full Review";
  if (day.kind === "boss_battle") return "Boss Battle";
  if (day.kind === "chapter_boss_battle") return "Chapter Boss Battle";
  if (day.kind === "weekly_review") return "Weekly Review";
  return "Monthly Review";
}

function DayStatusIcon({ day, isCompleted, isUnlocked }: { day: MemorizationDay; isCompleted: boolean; isUnlocked: boolean }) {
  if (!isCompleted && !isUnlocked) return <Lock size={18} />;
  if (isCompleted) return <Check size={22} />;
  if (day.kind === "chapter_review") return <BookOpen size={26} />;
  if (day.kind === "boss_battle" || day.kind === "chapter_boss_battle") return <Swords size={26} />;
  if (day.kind === "weekly_review") return <Repeat size={26} />;
  if (day.kind === "monthly_review") return <History size={26} />;
  return <GraduationCap size={26} />;
}

interface DayCircleProps {
  day: MemorizationDay;
  isCompleted: boolean;
  isUnlocked: boolean;
  progress: number;
  offset: "left" | "right" | "center";
  onSelect: () => void;
  onPractice: () => void;
}

const BOSS_BATTLE_KINDS = new Set(["boss_battle", "chapter_boss_battle"]);
const OFFSET_CLASSES: Record<DayCircleProps["offset"], string> = {
  left: "-translate-x-8",
  right: "translate-x-8",
  center: "",
};

// Every lesson is clickable regardless of lock state — locked ones stay visually muted so
// normal progression still reads clearly, but nothing blocks jumping ahead to check a
// lesson works before it's "really" unlocked. Three distinct visual states carry that at a
// glance: locked (small, muted outline), the one active/unlocked node (larger, glowing,
// gently pulsing so it reads as "you are here"), and completed (solid fill, crisp check).
export function DayCircle({ day, isCompleted, isUnlocked, progress, offset, onSelect, onPractice }: DayCircleProps) {
  const label = dayLabel(day);
  const canPractice = BOSS_BATTLE_KINDS.has(day.kind);
  const size = isUnlocked ? "h-20 w-20" : isCompleted ? "h-16 w-16" : "h-14 w-14";

  return (
    <div className={`flex flex-col items-center gap-2 transition-transform ${OFFSET_CLASSES[offset]}`}>
      <span className="max-w-[10rem] text-center text-caption text-ink-soft dark:text-zinc-400">{label}</span>
      <motion.button
        type="button"
        whileTap={TAP_SCALE}
        onClick={onSelect}
        animate={isUnlocked ? { scale: [1, 1.04, 1] } : undefined}
        transition={isUnlocked ? { duration: 2, repeat: Infinity, ease: "easeInOut" } : undefined}
        aria-label={`${label} — ${isCompleted ? "completed" : isUnlocked ? "available" : "locked, tap to preview"}`}
        className={`flex items-center justify-center rounded-full font-semibold ${size} ${
          isCompleted
            ? "bg-brand-600 text-white"
            : isUnlocked
              ? "bg-brand-500 text-white shadow-[0_4px_14px_rgba(212,163,115,0.4)]"
              : "border-2 border-line bg-transparent text-ink-muted dark:border-zinc-700 dark:text-zinc-600"
        }`}
      >
        <DayStatusIcon day={day} isCompleted={isCompleted} isUnlocked={isUnlocked} />
      </motion.button>
      {isUnlocked && progress > 0 && (
        <div
          className="h-1.5 w-16 overflow-hidden rounded-full bg-mist dark:bg-zinc-700"
          role="progressbar"
          aria-label={`${label} in progress`}
          aria-valuenow={Math.round(progress * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <motion.div
            className="h-full rounded-full bg-brand-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress * 100}%` }}
            transition={{ duration: MOTION_DURATION.base }}
          />
        </div>
      )}
      {canPractice && (
        <button type="button" onClick={onPractice} className="text-xs font-medium text-brand-600 hover:underline">
          Practice
        </button>
      )}
    </div>
  );
}
