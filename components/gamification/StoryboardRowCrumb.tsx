"use client";

import { useMemo } from "react";
import type { MemorizationDay } from "@/types";
import { parsePathKey } from "@/lib/memorizationContent";
import { STORYBOARD_COLUMNS, storyboardRow } from "@/lib/storyboardRow";
import { buildTrail } from "@/lib/trailStops";
import { pericopeNumber, pericopeTone } from "@/lib/pericopeTones";
import { useVersePicture } from "@/lib/useVersePicture";
import { pictureById } from "@/lib/verseImages";
import type { ParsedVerseKey } from "@/lib/verseKey";

interface CrumbCellProps {
  book: string;
  chapter: number;
  verseNumber: number;
  fill: string;
  here: boolean;
}

function CrumbCell({ book, chapter, verseNumber, fill, here }: CrumbCellProps) {
  const Icon = pictureById(useVersePicture(book, chapter, verseNumber) ?? "")?.Icon;
  return (
    <span aria-current={here ? "step" : undefined} className={`flex h-6 min-w-0 flex-1 items-center justify-center gap-1 rounded-md border-2 ${fill} ${here ? "border-brand-500" : "border-transparent"}`}>
      {Icon && <Icon size={12} strokeWidth={2.4} className="shrink-0 text-ink dark:text-zinc-100" />}
      <span className="text-[10px] font-extrabold leading-none text-ink dark:text-zinc-100">{verseNumber}</span>
    </span>
  );
}

interface StoryboardRowCrumbProps {
  place: ParsedVerseKey;
  // The lesson's path, whose storyboard this is.
  pathKey: string;
  days: MemorizationDay[];
}

// Where a lesson's verse sits in its path's storyboard (BookStructureStoryboard.tsx): that row's
// verses (lib/storyboardRow.ts), in their pericopes' colours, the verse you're on ringed in orange.
// Pictures and numbers only — the storyboard's first words would give away what a recall stage asks for.
export function StoryboardRowCrumb({ place, pathKey, days }: StoryboardRowCrumbProps) {
  const row = useMemo(() => storyboardRow(buildTrail(parsePathKey(pathKey).kind, days, 0, [], []), place), [pathKey, days, place]);
  if (!row.length) return null;
  const own = pericopeNumber(place.book, place.chapter, place.verseNumber);
  return (
    <div aria-label={`Verse ${place.verseNumber} in the storyboard`} className="mx-auto flex max-w-2xl gap-1 px-3 pb-1.5">
      {row.map((verse) => {
        const number = pericopeNumber(verse.book, verse.chapter, verse.verseNumber);
        const here = verse.book === place.book && verse.chapter === place.chapter && verse.verseNumber === place.verseNumber;
        return <CrumbCell key={`${verse.chapter}:${verse.verseNumber}`} book={verse.book} chapter={verse.chapter} verseNumber={verse.verseNumber} fill={pericopeTone(number, verse.chapter === place.chapter && number === own).fill} here={here} />;
      })}
      {/* A short last row keeps its panels where they are in the storyboard. */}
      {Array.from({ length: STORYBOARD_COLUMNS - row.length }, (_, gap) => (
        <span key={gap} className="min-w-0 flex-1" />
      ))}
    </div>
  );
}
