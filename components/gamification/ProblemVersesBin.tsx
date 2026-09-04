"use client";

import Link from "next/link";
import { useProgressStore } from "@/store/useProgressStore";
import { formatVerseSpanLabel } from "@/lib/chapterContent";
import { formatFlaggedAt } from "@/lib/problemVerses";
import { InfoTip } from "@/components/ui/InfoTip";
import { INFO_TIPS } from "@/lib/infoTipCopy";

function relearnHref(book: string, chapter: number, verseNumber: number, version: string): string {
  const query = new URLSearchParams({ book, chapter: String(chapter), verse: String(verseNumber), version });
  return `/memorized/relearn?${query}`;
}

// A standing list of individual verses whose most recent SRS review accuracy fell below
// PROBLEM_VERSE_ACCURACY_THRESHOLD (lib/problemVerses.ts) — a verse clears back out once a
// later review scores lib/srs.ts's PROMOTION_ACCURACY_THRESHOLD or higher, or once it's
// fully relearned (see SrsReviewSession.tsx / RelearnSession.tsx). See
// lib/verseAccuracyBreakdown.ts for how one review's accuracy is broken down per individual
// verse to populate this.
export function ProblemVersesBin() {
  const problemVerses = useProgressStore((state) => state.problemVerses);
  const entries = Object.values(problemVerses).sort((a, b) => b.flaggedAt.localeCompare(a.flaggedAt));

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="flex items-center gap-1.5 text-caption font-semibold uppercase tracking-wide text-brand-500">
        Problem Verses <InfoTip text={INFO_TIPS.problemVersesBin} />
      </p>
      {entries.length === 0 ? (
        <p className="text-xs text-ink-muted">No problem verses — nice work!</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {entries.map((entry) => (
            <li
              key={`${entry.book}|${entry.chapter}|${entry.verseNumber}`}
              className="flex items-center justify-between gap-3 rounded-xl bg-mist px-3 py-2 text-xs font-medium text-ink-soft dark:bg-zinc-800 dark:text-zinc-300"
            >
              <span className="flex flex-col">
                <span className="truncate">{formatVerseSpanLabel(entry.book, entry.chapter, entry.verseNumber, entry.verseNumber)}</span>
                <span className="text-ink-muted">{formatFlaggedAt(entry.flaggedAt)}</span>
              </span>
              <Link
                href={relearnHref(entry.book, entry.chapter, entry.verseNumber, entry.version)}
                className="shrink-0 rounded-full bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white"
              >
                Relearn
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
