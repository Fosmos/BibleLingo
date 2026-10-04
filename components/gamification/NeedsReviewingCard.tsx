"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, MapPin } from "lucide-react";
import type { MemorizedEntity } from "@/types";
import { useProgressStore } from "@/store/useProgressStore";
import { dueEntitiesInOrder } from "@/lib/srsReviewQueue";
import { formatVerseSpanLabel, getChapterVerses } from "@/lib/chapterContent";
import { reviewArrivalHref } from "@/lib/useReviewArrival";

const DAY_MS = 24 * 60 * 60 * 1000;
// A rough review length for the header's "about N min" — a little over a minute a range.
const reviewMinutes = (count: number) => Math.max(1, Math.round(count * 1.3));

function daysLate(entity: MemorizedEntity, now: number): number {
  return entity.srs.nextDueAt ? Math.max(0, Math.floor((now - new Date(entity.srs.nextDueAt).getTime()) / DAY_MS)) : 0;
}

// The opening words of a range, when its chapter is already cached on the device.
function openingWords(entity: MemorizedEntity): string | undefined {
  return getChapterVerses(entity.book, entity.chapter)?.[entity.startVerse - 1]?.text;
}

// Home's Needs reviewing box (the Organic restyle): every range due for spaced review, most
// overdue first. A row, or "Review all", starts reviewing on the Mind Map (lib/useReviewArrival.ts);
// each row's pin instead just takes you to that verse on the map, its review tab ready. Without an
// active path (no map to open) everything points to the Memorized tab. Hidden when nothing is due.
export function NeedsReviewingCard() {
  const entities = useProgressStore((state) => state.memorizedEntities);
  const activePathKey = useProgressStore((state) => state.activePathKey);
  const pathVersion = useProgressStore((state) => (state.activePathKey ? state.paths[state.activePathKey]?.version : undefined));
  // When Home opened — "days late" doesn't need to tick over while it's on screen.
  const [now] = useState(() => Date.now());
  const due = useMemo(() => {
    return dueEntitiesInOrder(entities, new Date(now))
      .map((entity) => ({ entity, late: daysLate(entity, now) }))
      .sort((a, b) => b.late - a.late);
  }, [entities, now]);
  if (due.length === 0) return null;

  const href = (ids: string[], start: boolean) => (activePathKey && pathVersion ? reviewArrivalHref(activePathKey, pathVersion, ids, start) : "/memorized");

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline gap-2.5">
        <h2 className="text-[22px] text-ink dark:text-zinc-100">Needs reviewing</h2>
        <span className="ml-auto text-[13px] font-semibold text-ink-muted">
          {due.length} due · about {reviewMinutes(due.length)} min
        </span>
      </div>
      <div className="flex flex-col rounded-organic bg-sand-100 p-1.5 shadow-organic-sm dark:bg-zinc-900">
        {due.map(({ entity, late }) => {
          const label = formatVerseSpanLabel(entity.book, entity.chapter, entity.startVerse, entity.endVerse);
          const cue = openingWords(entity);
          return (
            <div key={entity.id} className="flex items-center gap-2 rounded-3xl hover:bg-brand-100 dark:hover:bg-zinc-800">
              <Link href={href([entity.id], true)} className="flex min-w-0 flex-1 items-center gap-3.5 py-3 pl-3.5">
                <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${late > 0 ? "bg-brand-500" : "bg-sage-500"}`} />
                <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
                  <span className="flex items-baseline gap-2">
                    <span className="text-base font-bold text-ink dark:text-zinc-100">{label}</span>
                    <span className={`text-xs font-bold ${late > 0 ? "text-brand-700" : "text-ink-muted"}`}>
                      {late > 0 ? `${late} day${late === 1 ? "" : "s"} late` : "Due today"}
                    </span>
                  </span>
                  {cue && <span className="truncate text-sm text-ink-muted">{cue}</span>}
                </span>
                <ChevronRight size={18} strokeWidth={2.75} className="shrink-0 text-sand-600" />
              </Link>
              <Link
                href={href([entity.id], false)}
                aria-label={`Show ${label} on the map`}
                title="Show on the map"
                className="mr-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-brand-600 hover:bg-brand-200"
              >
                <MapPin size={16} strokeWidth={2.75} />
              </Link>
            </div>
          );
        })}
        <Link
          href={href(due.map(({ entity }) => entity.id), true)}
          className="m-1.5 rounded-full bg-brand-500 py-[13px] text-center text-[15px] font-semibold text-paper hover:bg-brand-600 active:bg-brand-700"
        >
          Review all {due.length}
        </Link>
      </div>
    </div>
  );
}
