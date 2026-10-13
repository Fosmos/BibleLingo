import { X } from "lucide-react";
import type { VerseSegment } from "@/types";
import { ACTION_WORD, type VerseStatus } from "@/components/gamification/ChapterPathVerseNode";

interface VerseActionBarProps {
  verse: VerseSegment;
  status: VerseStatus;
  chosen: boolean;
  onAction: () => void;
  onChoose: () => void;
  onClose: () => void;
}

// The selected verse's Learn / Review / Practise / Preview (and Choose, for a verse not started),
// floating over the bottom of the chapter like ChapterActionBar.tsx — so the verse text itself
// never moves to make room for a button.
export function VerseActionBar({ verse, status, chosen, onAction, onChoose, onClose }: VerseActionBarProps) {
  return (
    <div className="absolute inset-x-3 bottom-[calc(6.5rem+env(safe-area-inset-bottom))] z-[5] flex items-center gap-2 rounded-organic bg-ink py-2.5 pl-2.5 pr-2.5 text-paper shadow-organic-lg dark:bg-zinc-100 dark:text-zinc-900">
      <button type="button" onClick={onClose} aria-label="Deselect verse" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full opacity-75 hover:opacity-100">
        <X size={18} />
      </button>
      <span className="min-w-0 flex-1 truncate font-heading text-base leading-tight">
        {verse.book} {verse.chapter}:{verse.verseNumber}
      </span>
      {status === "open" && (
        <button
          type="button"
          aria-pressed={chosen}
          onClick={onChoose}
          className={`whitespace-nowrap rounded-full px-3 py-[9px] text-[13px] font-extrabold ${chosen ? "bg-sage-200 text-sage-900" : "bg-paper/15 text-paper hover:bg-paper/25 dark:bg-zinc-900/10 dark:text-zinc-900"}`}
        >
          {chosen ? "Chosen ✓" : "Choose"}
        </button>
      )}
      <button type="button" onClick={onAction} className="whitespace-nowrap rounded-full bg-brand-500 px-3.5 py-[9px] text-[13px] font-extrabold text-paper hover:bg-brand-600">
        {ACTION_WORD[status]}
      </button>
    </div>
  );
}
