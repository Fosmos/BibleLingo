"use client";

import Link from "next/link";
import { formatVerseRangeLabel } from "@/lib/chapterContent";
import { readerHref, trailHref } from "@/lib/readerHref";
import { useTodaysDay } from "@/lib/useTodaysDay";

interface HomeLearnButtonProps {
  pathKey: string;
}

const ROW = "flex min-h-[84px] items-center gap-3 rounded-[18px] px-3.5 py-3";

// Home's main action: today's lesson on the path you're on, as a step to tick off. Once it's done,
// a quiet ticked row until tomorrow's is ready.
export function HomeLearnButton({ pathKey }: HomeLearnButtonProps) {
  const { plan, currentDay, restingUntilTomorrow, error } = useTodaysDay(pathKey);
  if (!plan) return null;
  if (restingUntilTomorrow) {
    return (
      <Link href={trailHref(pathKey, plan.version)} className={`${ROW} bg-sand-200 text-sand-800 dark:bg-zinc-800 dark:text-zinc-300`}>
        <span aria-hidden="true" className="h-7 w-7 shrink-0 rounded-lg bg-[#4F8A3C]" />
        <span className="flex flex-col gap-px">
          <span className="text-base font-extrabold">Today&rsquo;s lesson is done</span>
          <span className="text-[13px] font-semibold">The next one is ready tomorrow</span>
        </span>
      </Link>
    );
  }
  if (!currentDay) {
    if (!error) return <div aria-hidden="true" className="min-h-[84px] rounded-[18px] bg-sand-100 dark:bg-zinc-900" />;
    return (
      <Link href={trailHref(pathKey, plan.version)} className={`${ROW} bg-sand-200 text-[15px] font-extrabold text-ink dark:bg-zinc-800 dark:text-zinc-100`}>
        Open your path
      </Link>
    );
  }
  const learning = currentDay.kind === "learn";
  const into = learning && currentDay.dayNumber === plan.completedDays + 1 ? Math.min(plan.versesIntoDay ?? 0, currentDay.newVerses.length - 1) : 0;
  const verses = learning ? currentDay.newVerses.slice(into) : currentDay.reviewVerses;
  const first = verses[0];
  const href = readerHref(pathKey, plan.version, { learnDay: currentDay.dayNumber, verse: into > 0 && first ? `${first.chapter}:${first.verseNumber}` : undefined });
  return (
    <Link href={href} className={`${ROW} bg-[#A85A26] text-white shadow-[0_5px_0_#7A3F18]`}>
      <span aria-hidden="true" className="h-7 w-7 shrink-0 rounded-lg border-[3px] border-white" />
      <span className="flex min-w-0 flex-1 flex-col gap-px">
        <span className="text-[17px] font-extrabold leading-tight">{learning ? "Learn" : "Review"} {formatVerseRangeLabel(verses)}</span>
        <span className="text-[13px] font-semibold">{learning ? `${verses.length} new ${verses.length === 1 ? "verse" : "verses"}` : "Today’s review"}</span>
      </span>
      <span className="shrink-0 text-[15px] font-extrabold">Start ›</span>
    </Link>
  );
}
