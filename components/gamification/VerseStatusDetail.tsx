"use client";

import type { MemorizedEntity } from "@/types";
import { STRENGTH_LABELS, type VerseStrength } from "@/lib/bookGrid";
import { formatLastReviewed, formatNextReview, isDue } from "@/lib/srs";

interface VerseStatusDetailProps {
  entity?: MemorizedEntity;
  strength: VerseStrength;
}

// A tapped verse's strength and review dates, in its sheet.
export function VerseStatusDetail({ entity, strength }: VerseStatusDetailProps) {
  const now = new Date();
  const rows: [string, string][] = [["Strength", STRENGTH_LABELS[strength]]];
  if (entity) {
    rows.push(["Next review", isDue(entity.srs, now) ? "Due now" : formatNextReview(entity.srs.nextDueAt, now).replace(/^Next review /, "")]);
    rows.push(["Last reviewed", formatLastReviewed(entity.srs.lastReviewedAt, now)]);
    if (entity.srs.lastAccuracy !== undefined) rows.push(["Last score", `${entity.srs.lastAccuracy}%`]);
  }
  return (
    <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[13px]">
      {rows.map(([name, value]) => (
        <div key={name} className="flex flex-col">
          <dt className="font-bold text-sand-700 dark:text-zinc-400">{name}</dt>
          <dd className="font-extrabold text-ink dark:text-zinc-100">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
