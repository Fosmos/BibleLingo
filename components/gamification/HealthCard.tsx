"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import type { MemorizedEntity } from "@/types";
import { boxDisplayNumber } from "@/lib/srs";
import { formatVerseSpanLabel, getChapterVerses } from "@/lib/chapterContent";
import { healthDueText, healthStrength, healthTone, type HealthTone } from "@/lib/memorizedHealth";

interface HealthCardProps {
  entity: MemorizedEntity;
  href: string;
  now: Date;
}

// The strength bar's fill, by how the range is doing.
const BAR_CLASS: Record<HealthTone, string> = {
  due: "bg-brand-500",
  rooted: "bg-sage-700",
  growing: "bg-sage-400",
  book: "bg-sage-500",
};

// One range in the Memorized page's Health list: its reference and box, its opening words (when
// the chapter is cached), a strength bar and when it's next due. Tapping it reviews it on the map.
export function HealthCard({ entity, href, now }: HealthCardProps) {
  const tone = healthTone(entity, now);
  const due = tone === "due";
  const cue = getChapterVerses(entity.book, entity.chapter)?.[entity.startVerse - 1]?.text;

  return (
    <Link
      href={href}
      className="flex flex-col gap-2.5 rounded-organic bg-white px-[18px] py-4 shadow-organic-sm transition-colors hover:bg-sand-100 dark:bg-zinc-900 dark:hover:bg-zinc-800"
    >
      <div className="flex items-baseline gap-2.5">
        <span className="font-heading text-xl text-ink dark:text-zinc-100">
          {formatVerseSpanLabel(entity.book, entity.chapter, entity.startVerse, entity.endVerse)}
        </span>
        <span className="ml-auto shrink-0 rounded-full bg-sand-200 px-2.5 py-0.5 text-xs font-bold text-ink-soft dark:bg-zinc-800 dark:text-zinc-300">
          Box {boxDisplayNumber(entity.srs.box)}
        </span>
      </div>
      {cue && <p className="truncate text-sm text-ink-muted">{cue}</p>}
      <div className="flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-sand-200 dark:bg-zinc-800">
          <div
            className={`h-full w-[var(--strength)] rounded-full ${BAR_CLASS[tone]}`}
            style={{ "--strength": `${Math.max(6, Math.min(100, healthStrength(entity)))}%` } as CSSProperties}
          />
        </div>
        <span className={`shrink-0 text-xs font-bold ${due ? "text-brand-800 dark:text-brand-300" : "text-ink-muted"}`}>
          {healthDueText(entity, now)}
        </span>
      </div>
    </Link>
  );
}
