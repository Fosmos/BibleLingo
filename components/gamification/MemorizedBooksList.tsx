"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { MemorizedEntity } from "@/types";
import { libraryBooks } from "@/lib/memorizedLibrary";

const CARD = "rounded-[22px] border-2 border-sand-300 bg-sand-100 shadow-[0_4px_0_#DCD3C4] dark:border-zinc-700 dark:bg-zinc-900";

interface MemorizedBooksListProps {
  entities: MemorizedEntity[];
}

// The Memorized tab's list under the hero: one row per book (its verses, passages and how many are
// due), each opening that book's info page (BookStatsScreen.tsx) — its stats and its passages.
export function MemorizedBooksList({ entities }: MemorizedBooksListProps) {
  const [now] = useState(() => new Date());
  const books = useMemo(() => libraryBooks(entities, now), [entities, now]);

  return (
    <section className={`${CARD} flex flex-col overflow-hidden`} aria-label="Memorized verses by book">
      {books.map((group) => (
        <Link
          key={group.book}
          href={`/memorized/book?name=${encodeURIComponent(group.book)}`}
          className="flex items-center gap-2.5 border-t-2 border-sand-200 px-3.5 py-3 first:border-t-0 hover:bg-sand-200/60 dark:border-zinc-800 dark:hover:bg-zinc-800"
        >
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="font-heading text-[17px] leading-tight text-ink dark:text-zinc-100">{group.book}</span>
            <span className="text-xs font-extrabold text-ink-muted">
              {group.verseCount} {group.verseCount === 1 ? "verse" : "verses"} · {group.rows.length} {group.rows.length === 1 ? "passage" : "passages"}
            </span>
          </span>
          {group.dueCount > 0 && <span className="shrink-0 rounded-[9px] bg-brand-700 px-2 py-[3px] text-[10.5px] font-black uppercase tracking-[.06em] text-white">{group.dueCount} due</span>}
          <ChevronRight size={18} strokeWidth={2.75} className="shrink-0 text-sand-500" />
        </Link>
      ))}
    </section>
  );
}
