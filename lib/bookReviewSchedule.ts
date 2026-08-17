import type { VerseSegment } from "@/types";

const DAILY_POOL_CAPACITY = 7;
const BATCH_SIZE = 8;

export interface ChapterBucketState {
  // Chapters currently cycling through the daily single-chapter rotation (cap 7,
  // FIFO ring buffer — never empties, oldest evicted when a new chapter arrives).
  dailyPool: number[];
  // The most recently completed 8-chapter batch, evicted from dailyPool over time
  // and accumulated separately — reviewed weekly as its own circle. Null until the
  // first batch of 8 has fully evicted out of the daily pool.
  currentWeeklyBatch: number[] | null;
  // Every weekly batch that's since been superseded by a newer one — reviewed monthly,
  // growing forever as the book continues.
  monthlyBucket: number[];
}

// A chapter K "departs" the sliding review window (previous chapter + current chapter's
// progress) at the first lesson whose anchor chapter has moved two or more chapters past
// it — i.e. the first lesson index i where anchors[i] > K + 1.
function computeDepartureOrder(anchors: number[]): [chapter: number, lessonIndex: number][] {
  const maxChapter = Math.max(...anchors);
  const order: [number, number][] = [];
  for (let chapter = 1; chapter < maxChapter; chapter++) {
    const lessonIndex = anchors.findIndex((anchor) => anchor > chapter + 1);
    if (lessonIndex !== -1) order.push([chapter, lessonIndex]);
  }
  return order.sort((a, b) => a[1] - b[1]);
}

// For each learn-lesson (one per day-chunk), returns the bucket state as of that lesson —
// i.e. after processing every chapter departure that has occurred at or before it.
export function computeBucketStatesPerLesson(chunks: VerseSegment[][]): ChapterBucketState[] {
  const anchors = chunks.map((chunk) => chunk[0].chapter);
  const departureOrder = computeDepartureOrder(anchors);

  const dailyPool: number[] = [];
  let weeklyAccumulator: number[] = [];
  let currentWeeklyBatch: number[] | null = null;
  let monthlyBucket: number[] = [];
  let departurePointer = 0;

  const states: ChapterBucketState[] = [];

  for (let lessonIndex = 0; lessonIndex < chunks.length; lessonIndex++) {
    while (departurePointer < departureOrder.length && departureOrder[departurePointer][1] <= lessonIndex) {
      const [chapter] = departureOrder[departurePointer];
      departurePointer++;

      if (dailyPool.length < DAILY_POOL_CAPACITY) {
        dailyPool.push(chapter);
        continue;
      }

      const evicted = dailyPool.shift();
      dailyPool.push(chapter);
      if (evicted !== undefined) weeklyAccumulator.push(evicted);

      if (weeklyAccumulator.length === BATCH_SIZE) {
        if (currentWeeklyBatch) monthlyBucket = [...monthlyBucket, ...currentWeeklyBatch];
        currentWeeklyBatch = weeklyAccumulator;
        weeklyAccumulator = [];
      }
    }

    states.push({
      dailyPool: [...dailyPool],
      currentWeeklyBatch: currentWeeklyBatch ? [...currentWeeklyBatch] : null,
      monthlyBucket: [...monthlyBucket],
    });
  }

  return states;
}
