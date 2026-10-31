"use client";

import { motion } from "framer-motion";
import { BookOpen, MapPin, Repeat, RotateCw } from "lucide-react";
import { ACTION_WORD, STATUS_LABEL, type VerseStatus } from "@/lib/readerVerseStatus";
import { MOTION_DURATION, MOTION_EASE } from "@/lib/motionTokens";

interface ReaderActionBarProps {
  reference: string;
  status: VerseStatus;
  note: string;
  onAction: () => void;
  // Add a memory palace locus on this verse, or open the one it's on (named `locusName`).
  onLocus: () => void;
  locusName?: string;
}

const ICON: Record<VerseStatus, typeof BookOpen> = { current: BookOpen, open: BookOpen, due: RotateCw, rooted: Repeat, growing: Repeat };
const DOT_CLASS: Record<VerseStatus, string> = {
  due: "bg-brand-500",
  rooted: "bg-sage-600",
  growing: "bg-sage-300",
  current: "border-2 border-dashed border-ink dark:border-zinc-100",
  open: "border-2 border-sand-300 dark:border-zinc-600",
};

// The chapter reader's floating card for the selected verse (design_handoff_bible_progress → Action
// bar): its reference over its status ("Due · 3 days overdue" — kept here so selecting a verse
// never moves its text), and its one action — Learn, Review or Practise. Rises in on selection.
export function ReaderActionBar({ reference, status, note, onAction, onLocus, locusName }: ReaderActionBarProps) {
  const Icon = ICON[status];
  const detail = status === "current" ? "Your next verse" : `${STATUS_LABEL[status]} · ${note}`;
  return (
    <motion.div
      key={reference}
      initial={{ y: 16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: MOTION_DURATION.base, ease: MOTION_EASE.enter }}
      className="absolute inset-x-4 bottom-[calc(6.75rem+env(safe-area-inset-bottom))] z-[5] flex flex-col items-start gap-2"
    >
      <button type="button" onClick={onLocus} className="flex min-h-11 max-w-full items-center gap-1.5 rounded-full border border-sand-200 bg-[#FEFDFB] px-4 text-[13px] font-extrabold text-brand-700 shadow-organic-md dark:border-zinc-800 dark:bg-zinc-900 dark:text-brand-300">
        <MapPin size={15} strokeWidth={2.75} className="shrink-0" />
        <span className="truncate">{locusName ?? "Add locus"}</span>
      </button>
      <div className="flex w-full items-center gap-3 rounded-[26px] border border-sand-200 bg-[#FEFDFB]/95 py-2.5 pl-4 pr-2.5 shadow-organic-lg backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/95">
      <span aria-hidden="true" className={`h-3 w-3 shrink-0 rounded-full ${DOT_CLASS[status]}`} />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate font-heading text-[17px] leading-tight text-ink dark:text-zinc-100">{reference}</span>
        <span className="truncate text-xs font-bold text-sand-700 dark:text-zinc-400">{detail}</span>
      </div>
      <button
        type="button"
        onClick={onAction}
        className="flex items-center gap-1.5 whitespace-nowrap rounded-full bg-brand-500 py-2.5 pl-4 pr-5 text-sm font-extrabold text-white shadow-organic-sm transition-colors hover:bg-brand-600 active:scale-[.97]"
      >
        <Icon size={16} strokeWidth={2.75} />
        {ACTION_WORD[status]}
      </button>
      </div>
    </motion.div>
  );
}
