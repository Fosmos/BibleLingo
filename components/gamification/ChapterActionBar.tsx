import { formatRuns } from "@/lib/verseMemoryState";

interface ChapterActionBarProps {
  book: string;
  chapter: number;
  chosen: number[];
  due: number[];
  onLearn: (verses: number[]) => void;
  onReview: (verses: number[]) => void;
}

// The dark bar floating over the bottom of a chapter (shelf_path): the verses chosen to learn
// (Learn N, plus Review M if anything's due) or, failing that, what's due. Hidden with neither.
export function ChapterActionBar({ book, chapter, chosen, due, onLearn, onReview }: ChapterActionBarProps) {
  if (!chosen.length && !due.length) return null;
  const showing = chosen.length ? chosen : due;
  return (
    <div className="absolute inset-x-3 bottom-[calc(6.5rem+env(safe-area-inset-bottom))] z-[5] flex items-center gap-2 rounded-organic bg-ink py-2.5 pl-4 pr-2.5 text-paper shadow-organic-lg dark:bg-zinc-100 dark:text-zinc-900">
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="text-[10px] font-extrabold uppercase tracking-[.06em] opacity-75">{chosen.length ? "Chosen to learn" : "Needs review"}</span>
        <span className="truncate font-heading text-base leading-tight">
          {book} {chapter}:{formatRuns(showing)}
        </span>
      </div>
      {due.length > 0 && (
        <button type="button" onClick={() => onReview(due)} className="whitespace-nowrap rounded-full bg-brand-100 px-3 py-[9px] text-[13px] font-extrabold text-brand-800 hover:bg-brand-200">
          Review {due.length}
        </button>
      )}
      {chosen.length > 0 && (
        <button type="button" onClick={() => onLearn(chosen)} className="whitespace-nowrap rounded-full bg-brand-500 px-3.5 py-[9px] text-[13px] font-extrabold text-paper hover:bg-brand-600">
          Learn {chosen.length}
        </button>
      )}
    </div>
  );
}
