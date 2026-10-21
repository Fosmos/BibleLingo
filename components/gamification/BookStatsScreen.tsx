"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useProgressStore } from "@/store/useProgressStore";
import { libraryBooks } from "@/lib/memorizedLibrary";
import { bookStats } from "@/lib/bookStats";
import { useHasMounted } from "@/lib/useHasMounted";
import { useReviewHref } from "@/lib/useReviewHref";
import { useMemorizedChaptersLoaded } from "@/lib/useMemorizedChaptersLoaded";
import { FetchLoading } from "@/components/ui/FetchStatus";
import { MemorizedBackLink } from "@/components/gamification/MemorizedBackLink";
import { MemorizedVerseRow } from "@/components/gamification/MemorizedVerseRow";
import { StrugglesCard } from "@/components/gamification/StrugglesCard";

const CARD = "rounded-[22px] border-2 border-sand-300 bg-sand-100 shadow-[0_4px_0_#DCD3C4] dark:border-zinc-700 dark:bg-zinc-900";
const HEADING = "text-[11px] font-black uppercase tracking-[.08em] text-sage-800 dark:text-sage-300";

// A book's info page (`/memorized/book?name=`), reached by tapping it in the Memorized tab's list
// (MemorizedBooksList.tsx): how much of it you know and how well, when you started, the verses in it
// you struggle with (StrugglesCard.tsx), and its passages — each opening its own stats page.
export function BookStatsScreen() {
  const mounted = useHasMounted();
  const name = useSearchParams().get("name") ?? "";
  const entities = useProgressStore((state) => state.memorizedEntities);
  const paths = useProgressStore((state) => state.paths);
  const reviewHref = useReviewHref();
  const [now] = useState(() => new Date());
  useMemorizedChaptersLoaded(entities);
  const group = useMemo(() => libraryBooks(entities, now).find((book) => book.book === name), [entities, now, name]);
  if (!mounted) return <FetchLoading label="Loading…" />;
  if (!group) {
    return (
      <div className="flex flex-col items-start gap-3 px-[18px] pt-4">
        <MemorizedBackLink />
        <p className="text-sm font-semibold text-ink-muted">Nothing memorized in this book yet.</p>
      </div>
    );
  }

  const stats = bookStats(name, entities, paths, now);
  const tiles: [string, string][] = [
    ["Of the book", stats.percent === null ? "—" : `${stats.percent}%`],
    ["Chapters", String(stats.chapters)],
    ["Avg. accuracy", stats.averageAccuracy === null ? "—" : `${stats.averageAccuracy}%`],
    ["Reviews", String(stats.reviews)],
    ["Due now", String(stats.dueIds.length)],
    ["First memorized", stats.firstMemorized ?? "—"],
  ];
  const backHere = `/memorized/book?name=${encodeURIComponent(name)}`;

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-3 px-[18px] pb-28 pt-[calc(0.5rem+env(safe-area-inset-top))]">
      <MemorizedBackLink />
      <div className="flex flex-col">
        <h1 className="font-heading text-[30px] leading-tight text-ink dark:text-zinc-100">{name}</h1>
        <span className="text-xs font-extrabold text-ink-muted">
          {stats.verses} {stats.verses === 1 ? "verse" : "verses"} · {stats.passages} {stats.passages === 1 ? "passage" : "passages"}
        </span>
      </div>

      <section className={`${CARD} grid grid-cols-3 gap-y-3 p-3.5 text-center`} aria-label="Book stats">
        {tiles.map(([label, value]) => (
          <div key={label} className="flex flex-col gap-0.5">
            <span className={`font-black text-ink dark:text-zinc-100 ${value.length > 6 ? "text-[13px] leading-[1.35rem]" : "text-[20px] leading-tight"}`}>{value}</span>
            <span className="text-[11px] font-bold text-ink-muted">{label}</span>
          </div>
        ))}
      </section>

      {stats.dueIds.length > 0 && (
        <Link href={reviewHref(stats.dueIds, true) ?? "/memorized/review"} className="rounded-2xl bg-brand-500 py-3 text-center text-[13px] font-black uppercase tracking-[.06em] text-white shadow-[0_3px_0_#8C491A]">
          Review {stats.dueIds.length} due
        </Link>
      )}

      <StrugglesCard book={name} />

      <section className={`${CARD} flex flex-col px-3.5 pb-1.5 pt-3`} aria-label={`Passages in ${name}`}>
        <h2 className={HEADING}>Passages</h2>
        {group.rows.map((row) => (
          <MemorizedVerseRow
            key={row.entity.id}
            row={row}
            reviewHref={reviewHref([row.entity.id], true) ?? "/memorized/review"}
            statsHref={`/memorized/passage?id=${encodeURIComponent(row.entity.id)}&from=${encodeURIComponent(backHere)}`}
          />
        ))}
      </section>
    </div>
  );
}
