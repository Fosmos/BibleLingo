import type { MemorizationDay, PathProgress, VerseSegment } from "@/types";
import { parsePathKey } from "@/lib/memorizationContent";
import { buildBookDayPlan, DEFAULT_VERSES_PER_DAY } from "@/lib/bookDayPlan";
import { chunkVersesRespectingChapters } from "@/lib/chapterChunking";
import { pericopeAnchoredPreviousVerses } from "@/lib/previousVerseReview";

// One lesson per chunk of versesPerDay verses (review of everything learned so far, then
// that chunk of new verses), followed by a full-review day and a boss-battle day over the
// whole path. Defaults to 1 verse/lesson for path kinds with no verses-per-day picker. A
// lesson always gets the full versesPerDay verses requested, pericope boundaries aside — it
// only ever comes up short when a CHAPTER boundary falls inside it (see
// lib/chapterChunking.ts), which every path kind here is single-chapter for anyway (a
// multi-chapter selection is book mode's own buildBookDayPlan, below).
export function buildDayPlan(verses: VerseSegment[], versesPerDay = 1, usePericopeAnchor = false): MemorizationDay[] {
  const days: MemorizationDay[] = [];
  const chunks = chunkVersesRespectingChapters(verses, versesPerDay);
  // Just yesterday's lesson — the immediately preceding learn day's own new verses, whatever
  // that chunk's size happened to be. Empty on day 1 (nothing learned yet). Extended back to
  // its own pericope's start verse when usePericopeAnchor is on — see
  // lib/previousVerseReview.ts.
  let previousChunk: VerseSegment[] = [];
  let consumed = 0;
  for (const chunk of chunks) {
    days.push({
      dayNumber: days.length + 1,
      kind: "learn",
      newVerses: chunk,
      reviewVerses: verses.slice(0, consumed),
      previousVerses: pericopeAnchoredPreviousVerses(verses, previousChunk, usePericopeAnchor),
    });
    previousChunk = chunk;
    consumed += chunk.length;
  }

  // The last lesson's own chunk doubles as "yesterday's verses" for the chapter-review day's
  // previous-verse-review phase too — see MemorizationDay.previousVerses.
  const previousVerses = pericopeAnchoredPreviousVerses(verses, previousChunk, usePericopeAnchor);

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
// shape, no sliding window. `pegSystemEnabled` (the global Major-System toggle — undefined/
// false-safe for every caller that never renders a day's own previousVerses, like
// lib/progressSummary.ts and the Mind Map view, which can skip passing it entirely) combines
// with this path's own pericope-level Memory Palace tag choice to decide whether each learn
// day's "yesterday's verses" review gets pericope-anchored — see lib/previousVerseReview.ts.
export function buildPathDayPlan(key: string, verses: VerseSegment[], plan: PathProgress, pegSystemEnabled = false): MemorizationDay[] {
  const { kind } = parsePathKey(key);
  const usePericopeAnchor = pegSystemEnabled && (plan.locationTagLevels?.includes("pericope") ?? false);
  if (kind === "book") {
    return buildBookDayPlan(verses, plan.versesPerDay ?? DEFAULT_VERSES_PER_DAY, usePericopeAnchor);
  }
  return buildDayPlan(verses, plan.versesPerDay ?? 1, usePericopeAnchor);
}
