import type { MemorizationDay, ReviewStage, VerseSegment } from "@/types";
import { computeBucketStatesPerLesson } from "@/lib/bookReviewSchedule";
import { chunkVersesRespectingChapters } from "@/lib/chapterChunking";
import { pericopeAnchoredPreviousVerses } from "@/lib/previousVerseReview";

export const DEFAULT_VERSES_PER_DAY = 5;

// The current chapter's verses up to (not including) today's new chunk — anchored on the
// chunk's first verse, since review happens before that chunk is learned. Deliberately
// scoped to just this chapter — the post-learn "Chapter Review" stage below is meant to
// drill the chapter actually being worked on, not drag the previous chapter's verses back
// in every lesson (that carryover happens instead via the "Previous Verses" pre-lesson
// check, which just reviews yesterday's own lesson — see buildBookDayPlan's previousChunk).
function currentChapterReview(verses: VerseSegment[], chunk: VerseSegment[]): VerseSegment[] {
  const anchor = chunk[0];
  return verses.filter((verse) => verse.chapter === anchor.chapter && verse.verseNumber < anchor.verseNumber);
}

function versesForChapters(verses: VerseSegment[], chapters: number[]): VerseSegment[] {
  const wanted = new Set(chapters);
  return verses.filter((verse) => wanted.has(verse.chapter));
}

// Book mode only: chunks verses into versesPerDay-sized lessons, grouped by the chapter
// each lesson is anchored in (chapterGroup) so the path can be displayed one chapter at a
// time. A lesson always gets the full versesPerDay verses requested — it can freely span
// multiple pericopes now, but never a chapter boundary (see lib/chapterChunking.ts), so
// chapterGroup stays unambiguous.
//
// A chapter's own recall check (the old per-lesson daily-rotation review and the per-chapter
// boss battle) isn't in the path at all — once a chapter's last lesson completes, that
// chapter graduates into the SRS system (see getMemorizedVerses in lib/progressSummary.ts),
// and long-term review of it happens there on its own schedule instead of as a forced path
// day. Weekly/monthly batch reviews are inserted as their own circles exactly when a batch of
// 8 chapters newly completes (not on a fixed lesson-count cadence), tagged into whichever
// chapter's group they formed during — those stay in the path. The whole book ends with the
// same Full Review + Boss Battle capstone every other path kind uses.
export function buildBookDayPlan(verses: VerseSegment[], versesPerDay: number, usePericopeAnchor = false): MemorizationDay[] {
  const effectiveVersesPerDay = Math.max(1, versesPerDay);
  const chunks = chunkVersesRespectingChapters(verses, effectiveVersesPerDay);
  const bucketStates = computeBucketStatesPerLesson(chunks);

  const days: MemorizationDay[] = [];
  let dayNumber = 1;
  let previousWeeklyBatchKey = "";
  let previousMonthlyBucketKey = "";
  // Just yesterday's lesson — the immediately preceding learn day's own new verses (skipping
  // over any weekly/monthly review or boss-battle days in between, which aren't "a lesson").
  // Empty on the book's very first lesson. Extended back to its own pericope's start verse
  // when usePericopeAnchor is on — see lib/previousVerseReview.ts.
  let previousChunk: VerseSegment[] = [];

  chunks.forEach((chunk, index) => {
    const state = bucketStates[index];
    const chapterGroup = chunk[0].chapter;
    // Today's own newly-learned chunk is appended last — the post-learn recap should cover
    // everything memorized in-window, including what was JUST learned this lesson, not only
    // what came before it.
    const windowReview = [...currentChapterReview(verses, chunk), ...chunk];

    const postLearnReviewStages: ReviewStage[] = [];
    if (windowReview.length > 0) postLearnReviewStages.push({ label: "Chapter Review", verses: windowReview });

    days.push({
      dayNumber: dayNumber++,
      kind: "learn",
      newVerses: chunk,
      // Empty, not windowReview: that content already runs post-learn via
      // postLearnReviewStages below — putting it here too would review it twice, since
      // ReviewSection falls back to building a "pre" stage from reviewVerses whenever
      // reviewStages is absent (as it now always is for book-mode learn days).
      reviewVerses: [],
      postLearnReviewStages,
      previousVerses: pericopeAnchoredPreviousVerses(verses, previousChunk, usePericopeAnchor),
      chapterGroup,
    });
    previousChunk = chunk;

    // A weekly-review circle appears exactly when a fresh batch of 8 chapters forms
    // (not on a fixed interval), so it's always "the one that has all 8 at once." Right
    // after it, a section boss battle covers those same 8 chapters — first-letter typing
    // across all of them back to back, with more lives (20) than a single-chapter boss
    // battle gets, since it's a much longer recitation.
    const weeklyBatchKey = state.currentWeeklyBatch ? state.currentWeeklyBatch.join(",") : "";
    if (weeklyBatchKey && weeklyBatchKey !== previousWeeklyBatchKey) {
      const batchVerses = versesForChapters(verses, state.currentWeeklyBatch as number[]);
      days.push({
        dayNumber: dayNumber++,
        kind: "weekly_review",
        newVerses: [],
        reviewVerses: batchVerses,
        chapterGroup,
      });
      days.push({
        dayNumber: dayNumber++,
        kind: "section_boss_battle",
        newVerses: [],
        reviewVerses: batchVerses,
        chapterGroup,
      });
      previousWeeklyBatchKey = weeklyBatchKey;
    }

    // Likewise, a monthly-review circle appears exactly when the monthly bucket grows
    // (a weekly batch just got superseded and absorbed into it).
    const monthlyBucketKey = state.monthlyBucket.join(",");
    if (monthlyBucketKey && monthlyBucketKey !== previousMonthlyBucketKey) {
      days.push({
        dayNumber: dayNumber++,
        kind: "monthly_review",
        newVerses: [],
        reviewVerses: versesForChapters(verses, state.monthlyBucket),
        chapterGroup,
      });
      previousMonthlyBucketKey = monthlyBucketKey;
    }
  });

  days.push({
    dayNumber: dayNumber++,
    kind: "chapter_review",
    newVerses: [],
    reviewVerses: verses,
    previousVerses: pericopeAnchoredPreviousVerses(verses, previousChunk, usePericopeAnchor),
  });
  days.push({ dayNumber: dayNumber++, kind: "boss_battle", newVerses: [], reviewVerses: verses });

  return days;
}
