"use client";

import { useProgressStore } from "@/store/useProgressStore";
import { formatVerseSpanLabel } from "@/lib/chapterContent";
import { isDue, formatLastReviewed } from "@/lib/srs";
import { Button } from "@/components/ui/Button";

export function ReviewNeededCard() {
  const entities = useProgressStore((state) => state.memorizedEntities);
  const dueEntities = entities.filter((entity) => isDue(entity.srs));

  return (
    <div className="flex flex-1 flex-col gap-3 rounded-2xl bg-white p-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:border dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none">
      <p className="text-caption font-semibold uppercase tracking-wide text-brand-500">Needs Reviewing</p>
      {dueEntities.length === 0 ? (
        <p className="flex-1 text-sm text-ink-muted">Nothing needs reviewing right now.</p>
      ) : (
        <ul className="flex flex-1 flex-col">
          {dueEntities.map((entity) => (
            <li
              key={entity.id}
              className="flex items-center justify-between gap-3 border-b border-mist py-2.5 last:border-b-0 dark:border-zinc-800"
            >
              <span className="text-sm font-medium text-ink-soft dark:text-zinc-300">
                {formatVerseSpanLabel(entity.book, entity.chapter, entity.startVerse, entity.endVerse)}
              </span>
              <span className="shrink-0 rounded-full bg-mist px-2 py-0.5 text-xs text-ink-muted dark:bg-zinc-800">
                {formatLastReviewed(entity.srs.lastReviewedAt)}
              </span>
            </li>
          ))}
        </ul>
      )}
      <Button href={dueEntities.length > 0 ? "/memorized/review" : "/memorized"} variant="secondary" className="self-start">
        {dueEntities.length > 0 ? "Start Spaced Review" : "Memorized Verses"}
      </Button>
    </div>
  );
}
