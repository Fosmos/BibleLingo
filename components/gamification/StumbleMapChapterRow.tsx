"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp } from "lucide-react";
import { formatChapterLabel, formatVerseSpanLabel } from "@/lib/chapterContent";
import { ensureChapterLoaded, BibleFetchError } from "@/lib/bibleApiClient";
import type { VerseSegment } from "@/types";
import { VerseStumbleHeatMap } from "@/components/gamification/VerseStumbleHeatMap";

export interface StumbleVerseEntry {
  verseNumber: number;
  counts: number[];
  // A chapter's own stumbled verses can, in principle, have been reviewed under different
  // translations at different times — fetched per verse below rather than assuming one
  // version covers the whole chapter.
  version: string;
}

interface StumbleMapChapterRowProps {
  book: string;
  chapter: number;
  verses: StumbleVerseEntry[];
}

function relearnHref(book: string, chapter: number, verseNumber: number, version: string): string {
  const query = new URLSearchParams({ book, chapter: String(chapter), verse: String(verseNumber), version });
  return `/memorized/relearn?${query}`;
}

// One row in StumbleMapsSection.tsx — a whole CHAPTER's worth of stumbled verses grouped
// together (not one row per individual verse), collapsed-until-tapped with a lazy fetch on
// expand (this app's own established convention — see ProblemVerseRow.tsx). Fetches the
// chapter's own text ONCE on expand (keyed by its own most-common version among these verses,
// same "good enough" approximation every stumble-tracked verse already accepts — see
// StumbleMapsSection.tsx's own resolveVersion) rather than once per verse.
export function StumbleMapChapterRow({ book, chapter, verses }: StumbleMapChapterRowProps) {
  const [expanded, setExpanded] = useState(false);
  const [chapterVerses, setChapterVerses] = useState<VerseSegment[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const totalMisses = verses.reduce((sum, verse) => sum + verse.counts.reduce((inner, count) => inner + count, 0), 0);
  // Whichever version most of this chapter's own stumbled verses were last reviewed under —
  // a chapter's text is only ever cached under one translation at a time anyway (see
  // lib/bibleContentCache.ts), so this is just picking the best single guess to fetch by.
  const version = verses[0]?.version ?? "KJV";

  function toggle() {
    const next = !expanded;
    setExpanded(next);
    if (next && !chapterVerses && !error) {
      ensureChapterLoaded(book, chapter, version)
        .then((loaded) => setChapterVerses(loaded))
        .catch((err) => setError(err instanceof BibleFetchError ? err.message : "Couldn't load this chapter."));
    }
  }

  return (
    <li className="rounded-xl bg-white dark:bg-zinc-800">
      <button type="button" onClick={toggle} className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left">
        <span className="flex items-center gap-1.5">
          {expanded ? <ChevronUp size={13} className="shrink-0 text-ink-muted" /> : <ChevronDown size={13} className="shrink-0 text-ink-muted" />}
          <span className="font-serif text-sm font-semibold text-ink dark:text-zinc-100">{formatChapterLabel(book, chapter)}</span>
        </span>
        <span className="shrink-0 text-xs text-ink-muted">
          {verses.length} verse{verses.length === 1 ? "" : "s"} · {totalMisses} miss{totalMisses === 1 ? "" : "es"}
        </span>
      </button>
      {expanded && (
        <div className="flex flex-col gap-3 border-t border-line px-3 py-2.5 dark:border-zinc-700">
          {error ? (
            <p className="text-xs text-heart-600">{error}</p>
          ) : !chapterVerses ? (
            <p className="text-xs text-ink-muted">Loading…</p>
          ) : (
            verses.map((verse) => {
              const text = chapterVerses[verse.verseNumber - 1]?.text;
              return (
                <div key={verse.verseNumber} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-medium text-ink-muted">{formatVerseSpanLabel(book, chapter, verse.verseNumber, verse.verseNumber)}</span>
                    <Link
                      href={relearnHref(book, chapter, verse.verseNumber, verse.version)}
                      className="shrink-0 rounded-full bg-mist px-3 py-1 text-xs font-medium text-ink-soft dark:bg-zinc-700 dark:text-zinc-300"
                    >
                      Relearn
                    </Link>
                  </div>
                  {text ? <VerseStumbleHeatMap text={text} counts={verse.counts} /> : <p className="text-xs text-ink-muted">Verse not found.</p>}
                </div>
              );
            })
          )}
        </div>
      )}
    </li>
  );
}
