"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { MemorizedEntity } from "@/types";
import { libraryBooks } from "@/lib/memorizedLibrary";
import { shelfHref } from "@/lib/memorizedShelf";

interface MemorizedBooksListProps {
  entities: MemorizedEntity[];
}

// The Memorized tab's list under the hero: one row per book (its verses, passages and how many are
// due), each opening that book's chapters (MemorizedShelfScreen.tsx).
export function MemorizedBooksList({ entities }: MemorizedBooksListProps) {
  const [now] = useState(() => new Date());
  const books = useMemo(() => libraryBooks(entities, now), [entities, now]);

  return (
    <section className="flex flex-col" aria-label="Memorized verses by book">
      {books.map((group) => (
        <Link
          key={group.book}
          href={shelfHref(group.book)}
          className="flex min-h-[58px] items-center gap-2.5 border-t border-sand-200 py-2 hover:bg-sand-100 dark:border-zinc-900 dark:hover:bg-zinc-900"
        >
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="font-heading text-[19px] leading-tight text-ink dark:text-zinc-100">{group.book}</span>
            <span className="text-xs font-bold text-ink-muted">
              {group.verseCount} {group.verseCount === 1 ? "verse" : "verses"}
            </span>
          </span>
          <span className={`shrink-0 text-[13px] font-extrabold ${group.dueCount > 0 ? "text-[#A82E1E] dark:text-[#F0917F]" : "text-[#3F6E30] dark:text-[#9CCB8B]"}`}>{group.dueCount > 0 ? `${group.dueCount} due` : "All good"}</span>
          <ChevronRight size={18} strokeWidth={2.75} className="shrink-0 text-sand-500" />
        </Link>
      ))}
    </section>
  );
}
