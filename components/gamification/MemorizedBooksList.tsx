"use client";

import { useMemo, useState } from "react";
import { ChevronRight } from "lucide-react";
import type { MemorizedEntity } from "@/types";
import { libraryBooks } from "@/lib/memorizedLibrary";
import { useReviewHref } from "@/lib/useReviewHref";
import { MemorizedVerseRow } from "@/components/gamification/MemorizedVerseRow";

const CARD = "rounded-[22px] border-2 border-sand-300 bg-sand-100 shadow-[0_4px_0_#DCD3C4] dark:border-zinc-700 dark:bg-zinc-900";

interface MemorizedBooksListProps {
  entities: MemorizedEntity[];
}

// The Memorized tab's list under the hero: your passages by book — one row per book (its verses,
// passages and how many are due), opening to its passages. Each passage opens its stats page
// (PassageStatsScreen.tsx); a due one has a Review button that reviews it in place on the path it
// was memorized on (lib/useReviewHref.ts).
export function MemorizedBooksList({ entities }: MemorizedBooksListProps) {
  const reviewHref = useReviewHref();
  const [now] = useState(() => new Date());
  const [openBook, setOpenBook] = useState<string | null>(null);
  const books = useMemo(() => libraryBooks(entities, now), [entities, now]);

  return (
    <section className={`${CARD} flex flex-col overflow-hidden`} aria-label="Memorized verses by book">
      {books.map((group) => {
        const expanded = openBook === group.book;
        return (
          <div key={group.book} className="flex flex-col border-t-2 border-sand-200 first:border-t-0 dark:border-zinc-800">
            <button
              type="button"
              aria-expanded={expanded}
              onClick={() => setOpenBook(expanded ? null : group.book)}
              className="flex items-center gap-2.5 px-3.5 py-3 text-left hover:bg-sand-200/60 dark:hover:bg-zinc-800"
            >
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="font-heading text-[17px] leading-tight text-ink dark:text-zinc-100">{group.book}</span>
                <span className="text-xs font-extrabold text-ink-muted">
                  {group.verseCount} {group.verseCount === 1 ? "verse" : "verses"} · {group.rows.length} {group.rows.length === 1 ? "passage" : "passages"}
                </span>
              </span>
              {group.dueCount > 0 && (
                <span className="shrink-0 rounded-[9px] bg-brand-700 px-2 py-[3px] text-[10.5px] font-black uppercase tracking-[.06em] text-white">{group.dueCount} due</span>
              )}
              <ChevronRight size={18} strokeWidth={2.75} className={`shrink-0 text-sand-500 transition-transform ${expanded ? "rotate-90" : ""}`} />
            </button>
            {expanded && (
              <div className="flex flex-col px-3.5 pb-1.5">
                {group.rows.map((row) => (
                  <MemorizedVerseRow
                    key={row.entity.id}
                    row={row}
                    reviewHref={reviewHref([row.entity.id], true) ?? "/memorized/review"}
                    statsHref={`/memorized/passage?id=${encodeURIComponent(row.entity.id)}`}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}
