"use client";

import { RotateCcw } from "lucide-react";
import { useProgressStore } from "@/store/useProgressStore";
import { formatVerseSpanLabel } from "@/lib/chapterContent";
import { isDue } from "@/lib/srs";
import { Button } from "@/components/ui/Button";
import { InfoTip } from "@/components/ui/InfoTip";
import { INFO_TIPS } from "@/lib/infoTipCopy";

export function SrsOverview() {
  const entities = useProgressStore((state) => state.memorizedEntities);
  const dueEntities = entities.filter((entity) => isDue(entity.srs));

  return (
    // Same warm brand-50 tint + colored icon badge as TodayVersesCard on Home — this app's
    // one shared "content card" look, not a quieter variant of it.
    <div className="flex flex-col gap-3 rounded-2xl bg-brand-50 p-5 shadow-sm dark:border dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-500 text-white">
            <RotateCcw size={15} />
          </span>
          <p className="flex items-center gap-1.5 text-caption font-semibold uppercase tracking-wide text-brand-500">
            Spaced Review <InfoTip text={INFO_TIPS.srsOverview} />
          </p>
        </div>
        <Button href="/memorized/mastery" variant="secondary" className="shrink-0">
          Mastery Mode
        </Button>
      </div>
      {entities.length === 0 ? (
        // "finish learning A verse" undersold what actually unlocks this — a verse group
        // only joins Spaced Review once its WHOLE path finishes (every learn day plus any
        // closing review/boss battle — book mode graduates per chapter instead, sooner), not
        // after one single lesson. A reader who just finished their first day and then sees
        // this still say "nothing yet" reasonably reads that as broken; naming the actual
        // finish line (and the other, faster way in) heads that off.
        <p className="text-sm text-ink-muted">
          Nothing here yet — a verse group joins Spaced Review once you finish its whole path (or chapter, for a book), or you add one you
          already know below.
        </p>
      ) : dueEntities.length === 0 ? (
        <p className="text-sm text-ink-muted">
          You&apos;re all caught up! {entities.length} verse group{entities.length === 1 ? "" : "s"} being tracked.
        </p>
      ) : (
        <>
          <p className="text-sm text-ink-muted">
            {dueEntities.length} verse group{dueEntities.length === 1 ? "" : "s"} due for review.
          </p>
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {dueEntities.map((entity) => (
              <li
                key={entity.id}
                className="rounded-lg bg-white px-3 py-2 font-serif text-sm font-semibold text-ink dark:bg-zinc-800 dark:text-zinc-100"
              >
                {formatVerseSpanLabel(entity.book, entity.chapter, entity.startVerse, entity.endVerse)}
              </li>
            ))}
          </ul>
          <Button href="/memorized/review" className="self-start">
            Start Spaced Review
          </Button>
        </>
      )}
    </div>
  );
}
