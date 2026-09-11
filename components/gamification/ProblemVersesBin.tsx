"use client";

import { AlertTriangle } from "lucide-react";
import { useProgressStore } from "@/store/useProgressStore";
import { InfoTip } from "@/components/ui/InfoTip";
import { INFO_TIPS } from "@/lib/infoTipCopy";
import { ProblemVerseRow } from "@/components/gamification/ProblemVerseRow";

// A standing list of individual verses the reader had to explicitly reveal a letter for during
// SRS review (see VerseAccuracy.neededHint in lib/verseAccuracyBreakdown.ts) — a verse clears
// back out once a later review scores lib/srs.ts's PROMOTION_ACCURACY_THRESHOLD or higher, or
// once it's fully relearned (see SrsReviewSession.tsx / RelearnSession.tsx). Each row expands
// into its own Stumble Map (see ProblemVerseRow.tsx) showing exactly which words have been the
// trouble spots, not just that the verse is flagged.
export function ProblemVersesBin() {
  const problemVerses = useProgressStore((state) => state.problemVerses);
  const entries = Object.values(problemVerses).sort((a, b) => b.flaggedAt.localeCompare(a.flaggedAt));

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-brand-50 p-5 shadow-sm dark:border dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-500 text-white">
          <AlertTriangle size={15} />
        </span>
        <p className="flex items-center gap-1.5 text-caption font-semibold uppercase tracking-wide text-brand-500">
          Problem Verses <InfoTip text={INFO_TIPS.problemVersesBin} />
        </p>
      </div>
      {entries.length === 0 ? (
        <p className="text-xs text-ink-muted">No problem verses — nice work!</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {entries.map((entry) => (
            <ProblemVerseRow key={`${entry.book}|${entry.chapter}|${entry.verseNumber}`} entry={entry} />
          ))}
        </ul>
      )}
    </div>
  );
}
