"use client";

import type { ReactNode } from "react";
import { Lightbulb, MapPin } from "lucide-react";
import type { VerseSegment } from "@/types";
import type { DayRun, RunState } from "@/lib/chapterReadingRuns";
import { locationTagKey } from "@/lib/locationTags";
import { verseIconById } from "@/lib/verseIcons";
import { isStructuralWord } from "@/lib/structuralWords";

interface ChapterVerseRunProps {
  run: DayRun;
  state: RunState;
  locationTags: Record<string, string>;
  iconTags: Record<string, string>;
  pegActive: boolean;
  // The one verse number this run's own pericope pegs its mnemonic to (a section's own
  // startVerse — see BuildingRoomView.tsx, which pegs a pericope the same way). Undefined
  // while pericope data isn't ready yet. Deliberately just one verse, not every verse in the
  // run — the Major System hands back a resolvable word for literally any number, so without
  // this every single verse would show a pin marker (that was the bug: one in front of every
  // verse on the page, not just the section's own anchor).
  pegAnchorVerse?: number;
  // Learn/Review only (undefined everywhere else, including every real reading-view render):
  // for the verse(s) actually being drilled right now, returns whatever words that stage wants
  // shown in their place — the full verse, first letters only, or fully blanked (see
  // lib/verseWords.ts) — or undefined for a verse this run should render completely
  // normally. The verse's own number, structural-word bolding, and (for today's verses) gold
  // underline all still render exactly the same regardless — only the WORDS ever swap, so a
  // drilled verse never moves, resizes, or loses the one marking ("today's own verse") every
  // verse around it keeps.
  renderVerseWords?: (verse: VerseSegment) => ReactNode | undefined;
  // Blind-recall drills only (SRS review, the cumulative/chapter combine stages — every other
  // caller leaves it undefined): return false to keep a verse's own number hidden until the
  // reader has actually recalled the word right before it. Matches how the words and any
  // pericope heading on the same page also only appear as recall reaches them, so the page's
  // shape isn't given away ahead of time. Undefined = always shown (the reading view, Learn).
  isVerseNumberVisible?: (verse: VerseSegment) => boolean;
  onSelect: (dayNumber: number | undefined) => void;
}

// One tappable run of verses sharing an owning lesson day (see lib/chapterReadingRuns.ts's
// buildDayRuns) — always rendered inline within one continuous flowing paragraph, every state
// alike. "Today" used to get pulled out into its own boxed card; that box's own margin/padding
// shifted where every verse around it sat, which fights the whole point of fixed, non-
// scrolling pagination (see ChapterReadingView.tsx's own comment) — a verse's coordinates on
// the page should never move depending on what day it happens to be. Today's verses are
// marked with just a gold-colored number and a matching gold underline under their own
// words — no icon, no background wash, and no completed-verse checkmark either; those read as
// louder decoration competing with the verse text itself, where an underline stays quiet
// enough to sit under the words it's marking without fighting them for attention. Margin
// mnemonic markers (an active Loci tag, the section's own Peg
// word, or a reader-picked dual-coding icon — see lib/locationTags.ts /
// lib/pegSystem.ts / lib/verseIcons.ts) render as small inline glyphs immediately before a
// qualifying verse's own number — a pragmatic stand-in for a true outdented left-margin gutter,
// which would need a per-line grid layout to pull off against wrapped prose text. Every marker
// is a plain Lucide icon in its own distinct color, never a colorful emoji glyph — a raw emoji
// renders inconsistently across platforms and, sitting right next to the app's own clean icon
// set (the peg/icon tags, today's bookmark), reads as a mismatched, lower-effort afterthought
// rather than part of the same considered visual language.
export function ChapterVerseRun({
  run,
  state,
  locationTags,
  iconTags,
  pegActive,
  pegAnchorVerse,
  renderVerseWords,
  isVerseNumberVisible,
  onSelect,
}: ChapterVerseRunProps) {
  const numberColor =
    state === "completed" ? "text-green-600 dark:text-green-500" : state === "today" ? "text-gold-600 dark:text-gold-400" : "text-ink-muted";
  return (
    <span
      onClick={() => onSelect(run.dayNumber)}
      className={`rounded transition-colors ${run.dayNumber !== undefined ? "cursor-pointer hover:bg-black/5 dark:hover:bg-white/5" : ""} ${
        state === "future" ? "text-brand-900/70 dark:text-zinc-100/70" : "text-brand-900 dark:text-zinc-100"
      }`}
    >
      {run.verses.map((verse) => {
        const key = locationTagKey({ level: "verse", book: verse.book, chapter: verse.chapter, verseNumber: verse.verseNumber });
        const hasLoci = Boolean(locationTags[key]);
        const icon = verseIconById(iconTags[key]);
        return (
          <span key={verse.id}>
            {/* A continuation fragment of a verse split across the page break (verse.wordOffset
                set — see lib/chapterPagination.ts) skips every one of these: the number, and
                everything that visually pairs with it, already showed on the fragment before it. */}
            {hasLoci && !verse.wordOffset && <Lightbulb aria-hidden="true" size={10} className="mr-0.5 inline text-purple-500 dark:text-purple-400" />}
            {icon && !verse.wordOffset && <icon.Icon aria-hidden="true" size={10} className="mr-0.5 inline text-brand-500 dark:text-brand-400" />}
            {pegActive && verse.verseNumber === pegAnchorVerse && !verse.wordOffset && (
              <MapPin aria-hidden="true" size={10} className="mr-0.5 inline text-teal-600 dark:text-teal-400" />
            )}
            {!verse.wordOffset && (!isVerseNumberVisible || isVerseNumberVisible(verse)) && (
              <sup className={`mr-0.5 text-[0.9em] font-semibold ${numberColor}`}>{verse.verseNumber}</sup>
            )}
            <span className={state === "today" ? "underline decoration-gold-600 underline-offset-2 dark:decoration-gold-400" : undefined}>
              {renderVerseWords?.(verse) ??
                verse.text.split(/(\s+)/).map((token, tokenIndex) =>
                  isStructuralWord(token) ? (
                    <span key={tokenIndex} className="font-semibold text-brand-600 dark:text-brand-400">
                      {token}
                    </span>
                  ) : (
                    token
                  ),
                )}
            </span>{" "}
          </span>
        );
      })}
    </span>
  );
}
