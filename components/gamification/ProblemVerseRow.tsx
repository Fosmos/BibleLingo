"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { ProblemVerseEntry } from "@/types";
import { useProgressStore } from "@/store/useProgressStore";
import { formatVerseSpanLabel } from "@/lib/chapterContent";
import { formatFlaggedAt } from "@/lib/problemVerses";
import { verseKey } from "@/lib/verseKey";
import { ensureChapterLoaded, BibleFetchError } from "@/lib/bibleApiClient";
import { VerseStumbleHeatMap } from "@/components/gamification/VerseStumbleHeatMap";

interface ProblemVerseRowProps {
  entry: ProblemVerseEntry;
}

function relearnHref(book: string, chapter: number, verseNumber: number, version: string): string {
  const query = new URLSearchParams({ book, chapter: String(chapter), verse: String(verseNumber), version });
  return `/memorized/relearn?${query}`;
}

// One Problem Verses entry — a plain row until tapped, at which point it lazily fetches its
// own verse text (same ensureChapterLoaded pattern RelearnSession.tsx already uses, rather
// than fetching every entry's text up front) to show its Stumble Map (see
// VerseStumbleHeatMap.tsx) — exactly which words within it have actually been the trouble
// spots across past reviews, not just that the whole verse is flagged.
export function ProblemVerseRow({ entry }: ProblemVerseRowProps) {
  const counts = useProgressStore((state) => state.wordStumbleCounts[verseKey(entry.book, entry.chapter, entry.verseNumber)]);
  const [expanded, setExpanded] = useState(false);
  const [text, setText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function toggle() {
    const next = !expanded;
    setExpanded(next);
    if (next && !text && !error) {
      ensureChapterLoaded(entry.book, entry.chapter, entry.version)
        .then((loaded) => setText(loaded[entry.verseNumber - 1]?.text ?? null))
        .catch((err) => setError(err instanceof BibleFetchError ? err.message : "Couldn't load this verse."));
    }
  }

  return (
    <li className="rounded-xl bg-white dark:bg-zinc-800">
      <div className="flex items-center justify-between gap-3 px-3 py-2">
        <button type="button" onClick={toggle} className="flex flex-1 items-center gap-1.5 text-left">
          {expanded ? <ChevronUp size={13} className="shrink-0 text-ink-muted" /> : <ChevronDown size={13} className="shrink-0 text-ink-muted" />}
          <span className="flex flex-col">
            <span className="truncate font-serif text-sm font-semibold text-ink dark:text-zinc-100">
              {formatVerseSpanLabel(entry.book, entry.chapter, entry.verseNumber, entry.verseNumber)}
            </span>
            <span className="text-xs text-ink-muted">{formatFlaggedAt(entry.flaggedAt)}</span>
          </span>
        </button>
        <Link
          href={relearnHref(entry.book, entry.chapter, entry.verseNumber, entry.version)}
          className="shrink-0 rounded-full bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white"
        >
          Relearn
        </Link>
      </div>
      {expanded && (
        <div className="border-t border-line px-3 py-2.5 dark:border-zinc-700">
          {error ? (
            <p className="text-xs text-heart-600">{error}</p>
          ) : text ? (
            <VerseStumbleHeatMap text={text} counts={counts} />
          ) : (
            <p className="text-xs text-ink-muted">Loading…</p>
          )}
        </div>
      )}
    </li>
  );
}
