import type { MemorizationDay, PathProgress, VerseSegment } from "@/types";
import { parsePathKey } from "@/lib/memorizationContent";
import { buildBookDayPlan, DEFAULT_VERSES_PER_DAY } from "@/lib/bookDayPlan";

// One lesson per chunk of versesPerDay verses (review of everything learned so far, then
// that chunk of new verses), followed by a full-review day and a boss-battle day over the
// whole path. Defaults to 1 verse/lesson for path kinds with no verses-per-day picker.
export function buildDayPlan(verses: VerseSegment[], versesPerDay = 1): MemorizationDay[] {
  const days: MemorizationDay[] = [];
  let previousChunk: VerseSegment[] = [];
  for (let i = 0; i < verses.length; i += versesPerDay) {
    const chunk = verses.slice(i, i + versesPerDay);
    days.push({
      dayNumber: days.length + 1,
      kind: "learn",
      newVerses: chunk,
      reviewVerses: verses.slice(0, i),
      previousVerses: previousChunk,
    });
    previousChunk = chunk;
  }

  // The last learn day's new verses double as "yesterday's verses" for the chapter-review
  // day's previous-verse-review phase — see MemorizationDay.previousVerses.
  const previousVerses = days.length > 0 ? days[days.length - 1].newVerses : [];

  days.push({
    dayNumber: days.length + 1,
    kind: "chapter_review",
    newVerses: [],
    reviewVerses: verses,
    previousVerses,
  });

  days.push({
    dayNumber: days.length + 1,
    kind: "boss_battle",
    newVerses: [],
    reviewVerses: verses,
  });

  return days;
}

// Single dispatch point: book-kind paths chunk by versesPerDay with the sliding-window
// + daily/weekly/monthly rotation review system; every other path kind chunks by
// versesPerDay too (defaulting to 1) but stays with the simpler review-everything-so-far
// shape, no sliding window.
export function buildPathDayPlan(key: string, verses: VerseSegment[], plan: PathProgress): MemorizationDay[] {
  const { kind } = parsePathKey(key);
  if (kind === "book") {
    return buildBookDayPlan(verses, plan.versesPerDay ?? DEFAULT_VERSES_PER_DAY);
  }
  return buildDayPlan(verses, plan.versesPerDay ?? 1);
}
