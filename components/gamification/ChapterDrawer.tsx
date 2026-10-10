"use client";

import type { CSSProperties } from "react";
import type { BibleBook } from "@/types";
import { getChapterVerses } from "@/lib/chapterContent";
import { useVerseMemory, STATE_FILL } from "@/lib/useVerseMemory";
import { heldCount } from "@/lib/verseMemoryState";
import { getChapterVerseNumbers } from "@/lib/chapterVerseIndex";

interface ChapterDrawerProps {
  book: BibleBook;
  onOpen: (chapter: number) => void;
}

// Long books (Psalms, Isaiah…) show only the chapters with something held.
const SHOW_ALL_UP_TO = 30;

// A pulled-out book's chapters as small spines under its shelf, each filled true to scale once its
// length is known on this device — nothing is fetched for the drawer (ESV limits).
export function ChapterDrawer({ book, onOpen }: ChapterDrawerProps) {
  const memory = useVerseMemory();
  const bookCounts = memory.book(book.name);
  const chapters = Array.from({ length: book.chapterCount }, (_, i) => i + 1).map((chapter) => ({ chapter, counts: memory.chapter(book.name, chapter) }));
  const shown = book.chapterCount > SHOW_ALL_UP_TO ? chapters.filter((entry) => heldCount(entry.counts)) : chapters;
  const hidden = chapters.length - shown.length;

  return (
    <div className="mt-1 flex flex-col gap-2.5 rounded-organic bg-sand-100 px-4 py-3.5 dark:bg-zinc-900">
      <div className="flex items-baseline gap-2">
        <span className="flex-1 font-heading text-xl leading-tight text-ink dark:text-zinc-100">{book.name}</span>
        <span className="text-xs font-bold text-ink-muted">{heldCount(bookCounts) ? `${heldCount(bookCounts)} verses${bookCounts.due ? ` · ${bookCounts.due} due` : ""}` : "Not started"}</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {shown.map(({ chapter, counts }) => {
          // Its length from the cached text or the remembered verse index; until either knows, the
          // held count stands in so the fill never overflows.
          const length = getChapterVerses(book.name, chapter)?.length || getChapterVerseNumbers(book.name, chapter)?.length || Math.max(heldCount(counts), 1);
          return (
            <button
              key={chapter}
              type="button"
              onClick={() => onOpen(chapter)}
              aria-label={`${book.name} ${chapter}`}
              className="relative flex h-16 w-[30px] flex-col items-center gap-[3px] transition-transform hover:-translate-y-[3px]"
            >
              <span className="flex h-12 w-6 flex-col-reverse overflow-hidden rounded-b-[3px] rounded-t-[7px] border-2 border-sand-300 bg-paper dark:border-zinc-700 dark:bg-zinc-950">
                {(["rooted", "growing", "due"] as const)
                  .filter((state) => counts[state])
                  .map((state) => (
                    <span key={state} style={{ "--s": `${Math.max(3, Math.round((44 * counts[state]) / length))}px` } as CSSProperties} className={`h-[var(--s)] shrink-0 ${STATE_FILL[state]}`} />
                  ))}
              </span>
              <span className={`text-[11px] font-extrabold ${heldCount(counts) ? "text-ink dark:text-zinc-100" : "text-ink-muted"}`}>{chapter}</span>
              {counts.due > 0 && <span className="absolute -top-[5px] right-0 h-2.5 w-2.5 rounded-full border-2 border-sand-100 bg-brand-500 dark:border-zinc-900" />}
            </button>
          );
        })}
      </div>
      <span className="text-xs font-bold text-ink-muted">
        {hidden ? `${hidden} other chapters not started · ` : ""}Tap a chapter to open its path
      </span>
    </div>
  );
}
