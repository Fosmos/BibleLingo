"use client";

import type { ReactElement } from "react";
import { motion } from "framer-motion";
import { Lock, Check, BookOpen, Swords, GraduationCap, Repeat, History } from "lucide-react";
import type { DayKind, MemorizationDay } from "@/types";
import { formatVerseRangeLabel } from "@/lib/chapterContent";
import { MOTION_DURATION, TAP_SCALE } from "@/lib/motionTokens";

// The base (non-lock/check) icon for a day's kind, rendered directly (not returned as a
// component reference — the react-hooks/static-components rule flags "create then render a
// component variable" as a fresh identity every render).
export function dayKindIcon(kind: DayKind, size: number): ReactElement {
  if (kind === "chapter_review") return <BookOpen size={size} />;
  if (kind === "boss_battle" || kind === "section_boss_battle") return <Swords size={size} />;
  if (kind === "weekly_review") return <Repeat size={size} />;
  if (kind === "monthly_review") return <History size={size} />;
  return <GraduationCap size={size} />;
}

export function dayLabel(day: MemorizationDay): string {
  if (day.kind === "learn") {
    if (day.newVerses.length > 1) return formatVerseRangeLabel(day.newVerses);
    return day.newVerses[0]?.reference ?? `Lesson ${day.dayNumber}`;
  }
  if (day.kind === "chapter_review") return "Full Review";
  if (day.kind === "boss_battle") return "Boss Battle";
  if (day.kind === "section_boss_battle") {
    const first = day.reviewVerses[0];
    const last = day.reviewVerses[day.reviewVerses.length - 1];
    return first && last ? `Ch. ${first.chapter}-${last.chapter} Boss Battle` : "Section Boss Battle";
  }
  if (day.kind === "weekly_review") return "Weekly Review";
  return "Monthly Review";
}

export interface CirclePOA {
  who: string;
  action: string;
  additionalInfo: string;
}

function DayStatusIcon({
  day,
  isCompleted,
  isUnlocked,
  versePOA,
}: {
  day: MemorizationDay;
  isCompleted: boolean;
  isUnlocked: boolean;
  versePOA?: CirclePOA;
}) {
  // Once the reader has visualized this lesson (see VerseOrientationSummaryRep.tsx), their
  // own typed Who/Action take over the circle from here on, lock/check included.
  if (versePOA) {
    return (
      <div className="flex flex-col items-center justify-center gap-0.5 px-1.5 text-center">
        <span className="line-clamp-2 max-w-full text-[9px] font-medium leading-tight text-current">
          {[versePOA.who, versePOA.action, versePOA.additionalInfo].filter(Boolean).join(" ")}
        </span>
      </div>
    );
  }
  if (!isCompleted && !isUnlocked) return <Lock size={18} />;
  if (isCompleted) return <Check size={22} />;
  return dayKindIcon(day.kind, 26);
}

interface DayCircleProps {
  day: MemorizationDay;
  isCompleted: boolean;
  isUnlocked: boolean;
  progress: number;
  offset: "left" | "right" | "center";
  // The reader's own Visualize POA for this lesson's first verse (see UserProgress.versePOA
  // via setVersePOA) — replaces the circle's lock/check/kind icon with their own POA once set.
  versePOA?: CirclePOA;
  // Overrides dayLabel(day) with a specific verse's own reference — used by BuildingRoomView,
  // which shows one circle per individual verse rather than per lesson.
  labelOverride?: string;
  onSelect: () => void;
  onPractice: () => void;
}

export const BOSS_BATTLE_KINDS = new Set(["boss_battle", "section_boss_battle"]);
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
export function DayCircle({
  day,
  isCompleted,
  isUnlocked,
  progress,
  offset,
  versePOA,
  labelOverride,
  onSelect,
  onPractice,
}: DayCircleProps) {
  const label = labelOverride ?? dayLabel(day);
  const canPractice = BOSS_BATTLE_KINDS.has(day.kind);
  // A completed learn lesson gets the same redoable, no-stakes replay as a boss battle's
  // Practice button — just for that one lesson's own newly-learned verses, and labeled
  // "Review" instead, since "practice" reads oddly for a lesson you already finished. Both
  // share the same underlying route (see PracticeLoader.tsx's practiceVerses selection).
  const canReview = isCompleted && day.kind === "learn";
  // Bumped up a size across the board from the original lock/check/kind-only circle sizes —
  // once visualized, a circle needs to fit the reader's own typed Who/Action legibly.
  const size = isUnlocked ? "h-24 w-24" : isCompleted ? "h-20 w-20" : "h-16 w-16";

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
              ? "bg-brand-500 text-white shadow-[0_4px_14px_rgba(162,114,77,0.4)]"
              : "border-2 border-line bg-transparent text-ink-muted dark:border-zinc-700 dark:text-zinc-600"
        }`}
      >
        <DayStatusIcon day={day} isCompleted={isCompleted} isUnlocked={isUnlocked} versePOA={versePOA} />
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
      {(canPractice || canReview) && (
        <button type="button" onClick={onPractice} className="text-xs font-medium text-brand-600 hover:underline">
          {canPractice ? "Practice" : "Review"}
        </button>
      )}
    </div>
  );
}
