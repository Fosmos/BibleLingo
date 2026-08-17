"use client";

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
    <div className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-caption font-semibold uppercase tracking-wide text-brand-500">
          Spaced Review <InfoTip text={INFO_TIPS.srsOverview} />
        </p>
        <Button href="/memorized/mastery" variant="secondary" className="shrink-0">
          Mastery Mode
        </Button>
      </div>
      {entities.length === 0 ? (
        <p className="text-sm text-ink-muted">
          Nothing memorized yet — finish learning and reviewing a verse to start tracking it here.
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
                className="rounded-lg bg-mist px-3 py-2 text-sm font-medium text-ink-soft dark:bg-zinc-800 dark:text-zinc-300"
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
