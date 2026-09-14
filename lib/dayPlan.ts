import type { MemorizationDay, PathProgress, ReviewStage, VerseSegment } from "@/types";
import { parsePathKey } from "@/lib/memorizationContent";
import { buildBookDayPlan, DEFAULT_VERSES_PER_DAY } from "@/lib/bookDayPlan";
import { chunkVersesRespectingChapters } from "@/lib/chapterChunking";

// One lesson per chunk of versesPerDay verses (review of everything learned so far, then
// that chunk of new verses), followed by a full-review day and a boss-battle day over the
// whole path. Defaults to 1 verse/lesson for path kinds with no verses-per-day picker. A
// lesson always gets the full versesPerDay verses requested, pericope boundaries aside — it
// only ever comes up short when a CHAPTER boundary falls inside it (see
// lib/chapterChunking.ts), which every path kind here is single-chapter for anyway (a
// multi-chapter selection is book mode's own buildBookDayPlan, below).
//
// `includePostLearnChapterReview` (chapter mode only — see buildPathDayPlan below) gives each
// "learn" day the SAME sliding-window post-lesson review book mode's own buildBookDayPlan
// already runs: everything learned in the chapter so far, including today's own new chunk,
// typed first-letter from the beginning right after the lesson (see
// MemorizationDay.postLearnReviewStages, consumed by VerseLessonFlow.tsx's own "postReview"
// phase → ReviewSection → ReviewChain). Verse/topic mode paths skip it — their own `verses`
// can span several books/chapters, so "review the chapter from the beginning" has no single
// chapter to mean.
export function buildDayPlan(verses: VerseSegment[], versesPerDay = 1, includePostLearnChapterReview = false): MemorizationDay[] {
  const days: MemorizationDay[] = [];
  const chunks = chunkVersesRespectingChapters(verses, versesPerDay);
  // Just yesterday's lesson — the immediately preceding learn day's own new verses, whatever
  // that chunk's size happened to be. Empty on day 1 (nothing learned yet).
  let previousChunk: VerseSegment[] = [];
  let consumed = 0;
  for (const chunk of chunks) {
    const learnedSoFar = verses.slice(0, consumed);
    const postLearnReviewStages: ReviewStage[] =
      includePostLearnChapterReview && learnedSoFar.length + chunk.length > 0
        ? [{ label: "Chapter Review", verses: [...learnedSoFar, ...chunk] }]
        : [];
    days.push({
      dayNumber: days.length + 1,
      kind: "learn",
      newVerses: chunk,
      // Empty (not learnedSoFar) once the post-learn stage above covers that same ground —
      // same "don't review it twice" convention buildBookDayPlan's own reviewVerses follows.
      reviewVerses: includePostLearnChapterReview ? [] : learnedSoFar,
      postLearnReviewStages: postLearnReviewStages.length > 0 ? postLearnReviewStages : undefined,
      previousVerses: previousChunk,
    });
    previousChunk = chunk;
    consumed += chunk.length;
  }

  // The last lesson's own chunk doubles as "yesterday's verses" for the chapter-review day's
  // previous-verse-review phase too — see MemorizationDay.previousVerses.
  const previousVerses = previousChunk;

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
  return buildDayPlan(verses, plan.versesPerDay ?? 1, kind === "chapter");
}

// GuidedPathFlow.tsx's own "I've already learned some of this" starting-point picker: how
// many days count as already done if the reader claims everything through `chapter`/
// `verseNumber` (inclusive) is already memorized — the LAST day whose entire `newVerses`
// chunk falls at or before that point, so day (result + 1) is the first one that would
// actually teach them something new.
export function completedDaysThroughVerse(days: MemorizationDay[], chapter: number, verseNumber: number): number {
  let completedDays = 0;
  for (const day of days) {
    const hasLaterVerse = day.newVerses.some(
      (verse) => verse.chapter > chapter || (verse.chapter === chapter && verse.verseNumber > verseNumber),
    );
    if (hasLaterVerse) break;
    completedDays = day.dayNumber;
  }
  return completedDays;
}
