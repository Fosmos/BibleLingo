"use client";

import Link from "next/link";
import type { LibraryRow } from "@/lib/memorizedLibrary";
import { SrsSeal } from "@/components/ui/SrsSeal";

interface MemorizedVerseRowProps {
  row: LibraryRow;
  // Where "Review" goes (lib/useReviewHref.ts) — only shown on due rows.
  reviewHref: string;
  // Tapping the row itself — the passage's stats page (PassageStatsScreen.tsx).
  statsHref: string;
}

// One range in the Memorized tab's lists: its spaced-review seal (bronze → diamond by box —
// SrsSeal.tsx), reference, when it's due, and a Review button on due rows; tapping it opens its stats. Rows sit inside a card and divide with a sand rule.
export function MemorizedVerseRow({ row, reviewHref, statsHref }: MemorizedVerseRowProps) {
  const due = row.tone === "due";
  return (
    <div className="flex items-center gap-2.5 border-t-2 border-sand-200 py-[9px] first:border-t-0 dark:border-zinc-800">
      <Link href={statsHref} className="flex min-w-0 flex-1 items-center gap-2.5">
        <SrsSeal tier={row.seal} size={30} />
        <span className="flex min-w-0 flex-1 flex-col gap-px">
          <span className="truncate text-[14.5px] font-black text-ink dark:text-zinc-100">{row.label}</span>
          <span className={`text-[11.5px] font-extrabold ${due ? "text-brand-800 dark:text-brand-300" : "text-ink-muted"}`}>{row.dueText}</span>
        </span>
      </Link>
      {due && (
        <Link
          href={reviewHref}
          className="shrink-0 rounded-xl bg-brand-500 px-[11px] py-[7px] text-[11px] font-black uppercase tracking-[.06em] text-white shadow-[0_3px_0_#8C491A] transition-[transform,box-shadow] duration-75 hover:bg-brand-600 active:translate-y-[3px] active:shadow-none"
        >
          Review
        </Link>
      )}
    </div>
  );
}
