"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";
import type { ChapterNode } from "@/lib/useMindMapData";
import { PathDayList } from "@/components/gamification/PathDayList";

interface MindMapPathViewProps {
  chapter: ChapterNode;
  completedDays: number;
  onSelectDay: (dayNumber: number) => void;
  onPracticeDay: (dayNumber: number) => void;
  onBack: () => void;
}

const PILL_FILL_BY_STATUS = {
  active: "bg-brand-500 border-brand-600 text-white",
  completed: "bg-brand-100 border-brand-400 text-brand-700 dark:bg-brand-900/40 dark:border-brand-700 dark:text-brand-300",
  locked: "bg-mist border-line text-ink-muted dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-500",
} as const;

// The "real path view" a pericope pill opens into (see MindMapCanvas.tsx) — a chapter pill
// header, a short connector, then the exact PathDayList/PericopeCard list the actual Path
// tab renders for this chapter, so its grid/Learn button is pixel-for-pixel the real thing
// rather than a mind-map-specific stand-in. Split out of MindMapCanvas.tsx purely to keep
// that file under this codebase's 200-line cap.
export function MindMapPathView({ chapter, completedDays, onSelectDay, onPracticeDay, onBack }: MindMapPathViewProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`pathview-${chapter.chapter}`}
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.92 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="flex h-full w-full flex-col overflow-hidden"
      >
        <button
          type="button"
          onClick={onBack}
          className="m-3 self-start rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-ink shadow-sm dark:bg-zinc-900 dark:text-zinc-100"
        >
          ← Back to mind map
        </button>
        <div className="flex shrink-0 flex-col items-center">
          <div className={`flex items-center gap-1.5 rounded-full border-2 px-5 py-2.5 text-sm font-semibold ${PILL_FILL_BY_STATUS[chapter.status]}`}>
            {chapter.status === "completed" && <Check size={14} />}
            Ch. {chapter.chapter}
          </div>
          <div className="h-6 w-0.5 border-l-2 border-dotted border-line dark:border-zinc-700" aria-hidden="true" />
        </div>
        <PathDayList days={chapter.days} completedDays={completedDays} onSelectDay={onSelectDay} onPracticeDay={onPracticeDay} />
      </motion.div>
    </AnimatePresence>
  );
}
