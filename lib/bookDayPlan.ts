import type { MemorizationDay, ReviewStage, VerseSegment } from "@/types";
import { computeBucketStatesPerLesson } from "@/lib/bookReviewSchedule";

export const DEFAULT_VERSES_PER_DAY = 5;

function chunkVerses(verses: VerseSegment[], size: number): VerseSegment[][] {
  const chunks: VerseSegment[][] = [];
  for (let index = 0; index < verses.length; index += size) {
    chunks.push(verses.slice(index, index + size));
  }
  return chunks;
}

// Previous chapter in full, plus the current chapter's verses up to (not including)
// today's new chunk — anchored on the chunk's first verse, since review happens before
// that chunk is learned.
function slidingWindowReview(verses: VerseSegment[], chunk: VerseSegment[]): VerseSegment[] {
  const anchor = chunk[0];
  return verses.filter(
    (verse) =>
      verse.chapter === anchor.chapter - 1 || (verse.chapter === anchor.chapter && verse.verseNumber < anchor.verseNumber),
  );
}

function versesForChapters(verses: VerseSegment[], chapters: number[]): VerseSegment[] {
  const wanted = new Set(chapters);
  return verses.filter((verse) => wanted.has(verse.chapter));
}

// Book mode only: chunks verses into versesPerDay-sized lessons, grouped by the chapter
// each lesson is anchored in (chapterGroup) so the path can be displayed one chapter at a
// time. A lesson whose tail verses spill into the next chapter still belongs to its
// anchor chapter's group — the boss battle for a chapter always covers that chapter's
// full verse set regardless of exactly which lesson taught its last few verses.
//
// Weekly/monthly batch reviews are inserted as their own circles exactly when a batch of
// 8 chapters newly completes (not on a fixed lesson-count cadence), tagged into whichever
// chapter's group they formed during. Each chapter gets its own boss-battle circle right
// after its last lesson. The whole book ends with the same Full Review + Boss Battle
// capstone every other path kind uses.
export function buildBookDayPlan(verses: VerseSegment[], versesPerDay: number): MemorizationDay[] {
  const chunks = chunkVerses(verses, Math.max(1, versesPerDay));
  const bucketStates = computeBucketStatesPerLesson(chunks);

  const days: MemorizationDay[] = [];
  let dayNumber = 1;
  let previousWeeklyBatchKey = "";
  let previousMonthlyBucketKey = "";
  // Advances by one only on lessons where the daily pool is non-empty, so the rotation
  // steps strictly 1, 2, 3, ... through the pool's current chapters and wraps back to the
  // start once it's cycled through all of them — independent of the book-wide lesson
  // index, which would otherwise skew the starting phase every time the pool's size changes.
  let rotationCursor = 0;

  chunks.forEach((chunk, index) => {
    const state = bucketStates[index];
    const chapterGroup = chunk[0].chapter;
    const windowReview = slidingWindowReview(verses, chunk);
    const rotationChapter = state.dailyPool.length > 0 ? state.dailyPool[rotationCursor % state.dailyPool.length] : null;
    const rotationReview = rotationChapter !== null ? versesForChapters(verses, [rotationChapter]) : [];
    if (state.dailyPool.length > 0) rotationCursor++;

    // Daily rotation chapter reviewed before today's new verse; the sliding two-chapter
    // window is reviewed AFTER it instead, so review of already-known material doesn't
    // stand between the user and the new verse they came here to learn.
    const reviewStages: ReviewStage[] = [];
    if (rotationReview.length > 0) reviewStages.push({ label: "Daily Review", verses: rotationReview });
    const postLearnReviewStages: ReviewStage[] = [];
    if (windowReview.length > 0) postLearnReviewStages.push({ label: "Chapter Review", verses: windowReview });
    const previousVerses = index > 0 ? chunks[index - 1] : [];

    days.push({
      dayNumber: dayNumber++,
      kind: "learn",
      newVerses: chunk,
      reviewVerses: [...rotationReview, ...windowReview],
      reviewStages,
      postLearnReviewStages,
      previousVerses,
      chapterGroup,
    });

    // A weekly-review circle appears exactly when a fresh batch of 8 chapters forms
    // (not on a fixed interval), so it's always "the one that has all 8 at once."
    const weeklyBatchKey = state.currentWeeklyBatch ? state.currentWeeklyBatch.join(",") : "";
    if (weeklyBatchKey && weeklyBatchKey !== previousWeeklyBatchKey) {
      days.push({
        dayNumber: dayNumber++,
        kind: "weekly_review",
        newVerses: [],
        reviewVerses: versesForChapters(verses, state.currentWeeklyBatch as number[]),
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

    const nextChapterGroup = chunks[index + 1]?.[0]?.chapter;
    if (nextChapterGroup !== chapterGroup) {
      days.push({
        dayNumber: dayNumber++,
        kind: "chapter_boss_battle",
        newVerses: [],
        reviewVerses: versesForChapters(verses, [chapterGroup]),
        chapterGroup,
      });
    }
  });

  days.push({ dayNumber: dayNumber++, kind: "chapter_review", newVerses: [], reviewVerses: verses });
  days.push({ dayNumber: dayNumber++, kind: "boss_battle", newVerses: [], reviewVerses: verses });

  return days;
}
