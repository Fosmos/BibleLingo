"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { MemorizedEntity } from "@/types";
import { allRows, dueRows, libraryBooks, reviewMinutes } from "@/lib/memorizedLibrary";
import { useReviewHref } from "@/lib/useReviewHref";
import { MemorizedVerseRow } from "@/components/gamification/MemorizedVerseRow";

type Tab = "due" | "books" | "all";
const ALL_PAGE = 12;
const CARD = "rounded-[22px] border-2 border-sand-300 bg-sand-100 shadow-[0_4px_0_#DCD3C4] dark:border-zinc-700 dark:bg-zinc-900";

interface MemorizedLibraryTabsProps {
  entities: MemorizedEntity[];
}

// The Memorized tab under the hero (design option 4b): Due / Books / All. Opens on Due, so a big
// library never crowds the screen; Books is a collapsible one-row-per-book index; All loads 12 at
// a time. Every Review reviews in place on the path it was memorized on (lib/useReviewHref.ts).
export function MemorizedLibraryTabs({ entities }: MemorizedLibraryTabsProps) {
  const reviewHref = useReviewHref();
  const [now] = useState(() => new Date());
  const [tab, setTab] = useState<Tab>("due");
  const [openBook, setOpenBook] = useState<string | null>(null);
  const [allShown, setAllShown] = useState(ALL_PAGE);

  const due = useMemo(() => dueRows(entities, now), [entities, now]);
  const books = useMemo(() => libraryBooks(entities, now), [entities, now]);
  const all = useMemo(() => allRows(entities, now), [entities, now]);

  const review = (ids: string[]) => reviewHref(ids, true) ?? "/memorized/review";
  const open = (id: string) => reviewHref([id], false) ?? "/memorized";
  const dueVerses = due.reduce((sum, row) => sum + row.verseCount, 0);

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "due", label: "Due", count: due.length },
    { id: "books", label: "Books", count: books.length },
    { id: "all", label: "All", count: all.length },
  ];

  return (
    <section className="flex flex-col gap-4">
      <div role="tablist" aria-label="Memorized verses" className="flex gap-1.5 rounded-2xl bg-sand-200 p-1 dark:bg-zinc-800">
        {tabs.map((option) => (
          <button
            key={option.id}
            type="button"
            role="tab"
            aria-selected={tab === option.id}
            onClick={() => setTab(option.id)}
            className={`flex-1 rounded-xl px-1 py-2.5 text-xs font-black uppercase tracking-[.06em] transition-colors ${
              tab === option.id
                ? "bg-white text-ink shadow-[0_3px_0_#DCD3C4] dark:bg-zinc-900 dark:text-zinc-100"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            {option.label} {option.count}
          </button>
        ))}
      </div>

      {tab === "due" &&
        (due.length === 0 ? (
          <p className="rounded-[22px] bg-sage-200 p-4 text-sm font-black text-sage-900">All caught up — nothing due today.</p>
        ) : (
          <>
            <Link
              href={review(due.map((row) => row.entity.id))}
              className="rounded-2xl bg-brand-500 p-3.5 text-center text-[14.5px] font-black uppercase tracking-[.08em] text-white shadow-[0_5px_0_#8C491A] transition-[transform,box-shadow] duration-75 hover:bg-brand-600 active:translate-y-[5px] active:shadow-none"
            >
              Review {due.length} due · {dueVerses} {dueVerses === 1 ? "verse" : "verses"} · ~{reviewMinutes(due.length)} min
            </Link>
            <div className={`${CARD} flex flex-col px-3.5 pb-1`}>
              {due.map((row) => (
                <MemorizedVerseRow key={row.entity.id} row={row} reviewHref={review([row.entity.id])} openHref={open(row.entity.id)} />
              ))}
            </div>
          </>
        ))}

      {tab === "books" && (
        <div className={`${CARD} flex flex-col overflow-hidden`}>
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
                    <span className="shrink-0 rounded-[9px] bg-brand-700 px-2 py-[3px] text-[10.5px] font-black uppercase tracking-[.06em] text-white">
                      {group.dueCount} due
                    </span>
                  )}
                  <ChevronRight size={18} strokeWidth={2.75} className={`shrink-0 text-sand-500 transition-transform ${expanded ? "rotate-90" : ""}`} />
                </button>
                {expanded && (
                  <div className="flex flex-col px-3.5 pb-1.5">
                    {group.rows.map((row) => (
                      <MemorizedVerseRow key={row.entity.id} row={row} reviewHref={review([row.entity.id])} openHref={open(row.entity.id)} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {tab === "all" && (
        <>
          <div className={`${CARD} flex flex-col px-3.5 pb-1`}>
            {all.slice(0, allShown).map((row) => (
              <MemorizedVerseRow key={row.entity.id} row={row} reviewHref={review([row.entity.id])} openHref={open(row.entity.id)} />
            ))}
          </div>
          {allShown < all.length && (
            <button
              type="button"
              onClick={() => setAllShown(all.length)}
              className="rounded-2xl border-2 border-sand-300 p-3 text-[13px] font-black uppercase tracking-[.06em] text-ink hover:bg-sand-100"
            >
              Show all {all.length}
            </button>
          )}
        </>
      )}
    </section>
  );
}
