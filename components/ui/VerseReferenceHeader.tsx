"use client";

import { useEffect, useState } from "react";
import { ensurePericopesLoaded, getPericopeForVerse } from "@/lib/chapterPericopes";

interface VerseReferenceHeaderProps {
  book: string;
  chapter: number;
  // The verse whose pericope should be looked up — for a cumulative multi-verse reference
  // (e.g. the final Learn stage's "everything learned so far"), pass the LAST verse of the
  // span, so the heading shown is the one covering where the reader currently stands.
  verseNumber: number;
  // Shown as its own line below the pericope — omit for a Learn-flow stage, which shows the
  // specific verse reference inline with the verse text itself instead (see
  // VerseTextLine.tsx); pass it for a stage (Review, Boss Battle, Practice) with no inline
  // verse-text reference of its own.
  reference?: string;
  // Smaller text throughout, for a stage that already has its own prominent caption above
  // this (e.g. WordTypeEntry.tsx, nested under Boss Battle's own heading + lives meter).
  compact?: boolean;
  // Suppresses just the pericope line (the verse `reference` below it, if any, still shows)
  // — for a caller that already showed this exact pericope line itself a moment ago (see
  // SrsEntityRecall.tsx's CompletedRecallStepView), where repeating it here would be a
  // redundant duplicate rather than new information.
  hidePericope?: boolean;
}

// Shown at the top of every Learn stage and every Review session: the pericope (section)
// this verse falls under, as one line — "Mark 1:1-8: John the Baptist Prepares the Way".
// Always ESV-sourced regardless of the reading translation (see
// lib/bibleProviders/esv.ts's fetchEsvPericopes) — fetched on demand and cached
// (lib/pericopeCache.ts), so this renders nothing until that lands, then re-renders once it
// does. Never blocks or errors the caller: a failed/missing pericope just means no line
// shows, since this is decorative context, not required content. A stage that instead asks
// the reader to recall/type the heading themselves (see PericopeHeadingTypeRep.tsx) never
// renders this at all rather than suppressing it via a prop here.
export function VerseReferenceHeader({ book, chapter, verseNumber, reference, compact, hidePericope }: VerseReferenceHeaderProps) {
  const [, setLoadTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    ensurePericopesLoaded(book, chapter).then(() => {
      if (!cancelled) setLoadTick((tick) => tick + 1);
    });
    return () => {
      cancelled = true;
    };
  }, [book, chapter]);

  const pericope = hidePericope ? undefined : getPericopeForVerse(book, chapter, verseNumber);
  const textSizeClass = compact ? "text-sm" : "text-title";
  // Bigger than the rest of this header, and set off by a 2-line gap above and below — so
  // the pericope title reads as its own bracketed heading rather than blending into
  // whatever line sits right before or after it (the previous section's last line, or this
  // one's own verse reference below).
  const pericopeSizeClass = compact ? "text-sm" : "text-2xl font-semibold";

  return (
    <div>
      {pericope && (
        <p className={`my-8 ${pericopeSizeClass}`}>
          <span className="text-brand-600 dark:text-brand-400">{pericope.label}:</span>{" "}
          <span className="text-brand-800 dark:text-brand-200">{pericope.heading}</span>
        </p>
      )}
      {reference && <p className={textSizeClass}>{reference}</p>}
    </div>
  );
}
