import { Check, RotateCw } from "lucide-react";
import { NODE_LANE_CLASSES } from "@/lib/chapterPathPalette";

export type VerseStatus = "rooted" | "growing" | "due" | "current" | "open";

interface ChapterPathVerseNodeProps {
  verseNumber: number;
  index: number;
  status: VerseStatus;
  selected: boolean;
  chosen: boolean;
  onSelect: () => void;
}

// Each memory state's look (shelf_path/SHELF_PATH.md → Memory states): due and rooted solid,
// growing pale, the path's next verse ringed in its pericope colour, open dashed.
const STATUS_CLASS: Record<VerseStatus, string> = {
  due: "border-brand-500 bg-brand-500 text-white",
  rooted: "border-sage-600 bg-sage-600 text-white",
  growing: "border-sage-400 bg-sage-200 text-sage-900",
  current: "border-[var(--p)] bg-[var(--p)] text-white shadow-[0_0_0_5px_var(--t)]",
  open: "border-dashed border-ink-muted bg-paper text-ink dark:bg-zinc-950 dark:text-zinc-200",
};

// A verse's node on the Chapter Path View's road — dark while selected, filled ink with a ✓ once
// chosen to learn, a ↻ badge while its review is due.
export function ChapterPathVerseNode({ verseNumber, index, status, selected, chosen, onSelect }: ChapterPathVerseNodeProps) {
  const look = selected
    ? "border-ink bg-ink text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
    : chosen
      ? "border-ink bg-ink text-paper dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
      : STATUS_CLASS[status];
  const badge = chosen ? <Check size={11} strokeWidth={3.5} /> : status === "due" ? <RotateCw size={10} strokeWidth={3} /> : null;
  return (
    <div className="relative flex w-16 flex-none">
      <button
        type="button"
        data-path-node
        aria-label={`Verse ${verseNumber}${chosen ? ", chosen" : ""}`}
        onClick={onSelect}
        className={`relative z-[4] flex h-[34px] w-[34px] items-center justify-center rounded-full border-[3px] p-0 font-heading text-[15px] leading-none ${NODE_LANE_CLASSES[index % NODE_LANE_CLASSES.length]} ${look}`}
      >
        {verseNumber}
        {badge && (
          <span className={`absolute -right-2 -top-2 flex h-[18px] w-[18px] items-center justify-center rounded-full border-2 border-paper text-white dark:border-zinc-950 ${chosen ? "bg-sage-600" : "bg-brand-500"}`}>
            {badge}
          </span>
        )}
      </button>
    </div>
  );
}
