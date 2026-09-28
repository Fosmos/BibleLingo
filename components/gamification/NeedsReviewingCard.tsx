"use client";

import { useMemo } from "react";
import Link from "next/link";
import { MapPin, RotateCcw } from "lucide-react";
import { useProgressStore } from "@/store/useProgressStore";
import { dueEntitiesInOrder } from "@/lib/srsReviewQueue";
import { formatVerseSpanLabel } from "@/lib/chapterContent";
import { reviewArrivalHref } from "@/lib/useReviewArrival";

// Home's Needs Reviewing box: every memorized range due for spaced review, in Bible order. Each
// row's map pin opens the Mind Map at that range, its review ready to start (see
// lib/useReviewArrival.ts). Hidden when nothing is due. Without an active path (no map to open)
// the rows point to the Memorized tab's own review instead.
export function NeedsReviewingCard() {
  const entities = useProgressStore((state) => state.memorizedEntities);
  const activePathKey = useProgressStore((state) => state.activePathKey);
  const pathVersion = useProgressStore((state) => (state.activePathKey ? state.paths[state.activePathKey]?.version : undefined));
  const due = useMemo(() => dueEntitiesInOrder(entities), [entities]);
  if (due.length === 0) return null;

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-brand-50 p-5 shadow-sm dark:border dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-yellow-400 text-ink">
          <RotateCcw size={15} />
        </span>
        <p className="text-caption font-semibold uppercase tracking-wide text-brand-500">Needs reviewing</p>
        <span className="ml-auto text-xs text-ink-muted">{due.length} due</span>
      </div>
      <ul className="flex flex-col gap-1.5">
        {due.map((entity) => {
          const label = formatVerseSpanLabel(entity.book, entity.chapter, entity.startVerse, entity.endVerse);
          const href = activePathKey && pathVersion ? reviewArrivalHref(activePathKey, pathVersion, entity.id) : "/memorized";
          return (
            <li key={entity.id} className="flex items-center gap-3 rounded-xl bg-white px-3 py-2 dark:bg-zinc-800">
              <span className="min-w-0 flex-1 truncate font-serif text-sm font-semibold text-ink dark:text-zinc-100">{label}</span>
              {entity.srs.lastAccuracy !== undefined && <span className="text-xs text-ink-muted">{Math.round(entity.srs.lastAccuracy)}%</span>}
              <Link
                href={href}
                aria-label={`Go to ${label} on the map`}
                title="Go there on the map"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-500 text-white hover:bg-brand-600"
              >
                <MapPin size={15} />
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
