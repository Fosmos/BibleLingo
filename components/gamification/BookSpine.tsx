import type { CSSProperties } from "react";
import type { BibleBook } from "@/types";
import { bookAbbreviation } from "@/lib/bibleRegions";
import { heldCount, spineSegments, type MemoryCounts } from "@/lib/verseMemoryState";
import { STATE_FILL } from "@/lib/useVerseMemory";

interface BookSpineProps {
  book: BibleBook;
  counts: MemoryCounts;
  pulled: boolean;
  onTap: () => void;
}

// One book on a shelf (BibleShelves.tsx): taller for longer books, filled bottom-up by memory state
// on a square-root scale so a handful of verses still shows on a long book; a dot above when due.
export function BookSpine({ book, counts, pulled, onTap }: BookSpineProps) {
  const height = Math.round(78 + Math.min(40, book.chapterCount / 2.5));
  const held = heldCount(counts);
  const fill = held ? Math.min(height - 26, Math.round(10 + Math.sqrt(held) * 9)) : 0;
  return (
    <button
      type="button"
      onClick={onTap}
      aria-label={`${book.name}${held ? `, ${held} verses memorized` : ""}${counts.due ? `, ${counts.due} due` : ""}`}
      aria-expanded={pulled}
      style={{ "--h": `${height}px` } as CSSProperties}
      className={`relative flex h-[var(--h)] min-w-[22px] max-w-[30px] flex-1 shrink-0 justify-center rounded-b rounded-t-lg bg-sand-100 transition-transform duration-200 dark:bg-zinc-800 ${pulled ? "-translate-y-2.5 shadow-organic-md" : ""}`}
    >
      <span className="absolute inset-x-0 bottom-0 flex flex-col-reverse overflow-hidden rounded-b">
        {spineSegments(counts, fill).map((segment) => (
          <span key={segment.state} style={{ "--s": `${segment.px}px` } as CSSProperties} className={`h-[var(--s)] ${STATE_FILL[segment.state]}`} />
        ))}
      </span>
      <span className={`relative mt-1.5 text-[10px] font-extrabold tracking-[.04em] [writing-mode:vertical-rl] ${held ? "text-ink dark:text-zinc-100" : "text-ink-muted"}`}>
        {bookAbbreviation(book.name)}
      </span>
      {counts.due > 0 && <span className="absolute -top-[9px] left-1/2 h-3 w-3 -translate-x-1/2 rounded-full border-2 border-paper bg-brand-500 dark:border-zinc-950" />}
    </button>
  );
}
