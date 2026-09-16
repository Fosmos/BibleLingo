import type { MemorizationDay, PathKind, PathProgress, ReviewStage, VerseSegment } from "@/types";
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
//
// `includePostLearnChapterReview` (chapter mode only — see buildPathDayPlan below) gives each
// "learn" day the SAME sliding-window post-lesson review book mode's own buildBookDayPlan
// already runs: everything learned in the chapter so far, including today's own new chunk,
// typed first-letter from the beginning right after the lesson (see
// MemorizationDay.postLearnReviewStages, consumed by VerseLessonFlow.tsx's own "postReview"
// phase → ReviewSection → ReviewChain). Verse/topic mode paths skip it — their own `verses`
// can span several books/chapters, so "review the chapter from the beginning" has no single
// chapter to mean.
export function buildDayPlan(
  verses: VerseSegment[],
  versesPerDay = 1,
  usePericopeAnchor = false,
  includePostLearnChapterReview = false,
  priorKnownVerseCount = 0,
): MemorizationDay[] {
  const days: MemorizationDay[] = [];
  // The already-known prefix (see PathProgress.priorKnownVerseCount) becomes day 1 verbatim,
  // whatever its real size — not chunked to versesPerDay like every other day, and not left
  // out of `days` either: lib/useChapterPagination.ts's own `verses` (what the reading view
  // actually renders) is built ENTIRELY from `learnDays.flatMap(day => day.newVerses)`, so a
  // verse that never appears in any day's own newVerses would silently vanish from the reading
  // view, not just skip being re-taught. store/pathActions.ts marks this day complete
  // immediately (completedDays starts at 1, not 0) whenever priorKnownVerseCount is set, so the
  // reader never actually sees or does it — day 2 (the first REAL new-content lesson) is what
  // opens as "today's lesson," starting exactly at the next verse.
  const knownPrefix = verses.slice(0, priorKnownVerseCount);
  if (knownPrefix.length > 0) {
    days.push({ dayNumber: 1, kind: "learn", newVerses: knownPrefix, reviewVerses: [], previousVerses: [] });
  }
  const chunks = chunkVersesRespectingChapters(verses.slice(priorKnownVerseCount), versesPerDay);
  // Just yesterday's lesson — the immediately preceding learn day's own new verses, whatever
  // that chunk's size happened to be. Empty on day 1 (nothing learned yet) AND on the first
  // REAL new-content chunk right after a known prefix — the prefix was never actually lessoned
  // (it's an auto-completed day the reader never sees, see the knownPrefix push above), so it
  // isn't a real "previous lesson" to quiz on; starting that first real chunk off with a
  // "review the whole known prefix" check would read as reviewing content that was never
  // taught. Real "previous verses" review only kicks in from the SECOND real chunk onward, once
  // there's an actual preceding lesson to check. Extended back to its own pericope's start verse
  // when usePericopeAnchor is on — see lib/previousVerseReview.ts.
  let previousChunk: VerseSegment[] = [];
  let consumed = priorKnownVerseCount;
  for (const chunk of chunks) {
    const learnedSoFar = verses.slice(0, consumed);
    // Only when there's real PRIOR content to review alongside today's new chunk — a lesson
    // whose own chunk starts at the chapter's own verse 1 (learnedSoFar empty — no prior known
    // prefix, no earlier chunk) has nothing to recap beyond what it just taught a moment ago;
    // see lib/bookDayPlan.ts's own identical fix for the book-mode equivalent.
    const postLearnReviewStages: ReviewStage[] =
      includePostLearnChapterReview && learnedSoFar.length > 0
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
  const priorKnownVerseCount = plan.priorKnownVerseCount ?? 0;
  if (kind === "book") {
    return buildBookDayPlan(verses, plan.versesPerDay ?? DEFAULT_VERSES_PER_DAY, usePericopeAnchor, priorKnownVerseCount);
  }
  return buildDayPlan(verses, plan.versesPerDay ?? 1, usePericopeAnchor, kind === "chapter", priorKnownVerseCount);
}

// GuidedPathFlow.tsx's own "I've already learned some of this" starting-point picker: how many
// of `verses`' own array positions, from the very start, the reader claims to already know,
// given they say everything through `chapter`/`verseNumber` (inclusive) is already memorized —
// the exact position right after that verse in the flat array (structural gap verses included,
// same convention lib/chapterChunking.ts already counts them by). Feeds
// PathProgress.priorKnownVerseCount directly, which buildDayPlan/buildBookDayPlan turn into a
// single auto-completed day 1 (see there) rather than a versesPerDay-sized chunk — so the
// first REAL lesson (day 2) starts exactly at the next verse, not wherever the fixed
// versesPerDay grid would have landed had chunking started from verse 1. Falls back to 0
// (nothing pre-known, start from the beginning) if the claimed verse can't be found in `verses`
// at all — shouldn't normally happen (the picker only ever offers a real verse from this same
// path's own content), but safer than an unbounded skip.
export function priorKnownVerseCountThrough(verses: VerseSegment[], chapter: number, verseNumber: number): number {
  const index = verses.findIndex((verse) => verse.chapter === chapter && verse.verseNumber === verseNumber);
  return index === -1 ? 0 : index + 1;
}

// How many auto-completed days a fresh path's own priorKnownVerseCount actually becomes, once
// buildDayPlan/buildBookDayPlan turn it into real days — PathProgress.completedDays needs to be
// seeded with EXACTLY this many (see store/pathActions.ts), not a flat 1, or the reader would
// either land back on a prior-known day as if it were a real lesson (seeded too low) or skip
// past real new content (seeded too high). Book mode's own prefix is chunked ONE DAY PER
// CHAPTER it spans (see buildBookDayPlan — every other day already carries that same "never
// crosses a chapter boundary" guarantee, so a single day covering a multi-chapter "I already
// know through chapter 12" claim would scramble lib/bookChapterView.ts's own chapterGroup
// filtering); every other kind's own path content can never span more than one chapter to begin
// with, so its prefix is always exactly one day.
export function priorKnownDayCount(verses: VerseSegment[], priorKnownVerseCount: number, kind: PathKind): number {
  if (priorKnownVerseCount <= 0) return 0;
  if (kind !== "book") return 1;
  return chunkVersesRespectingChapters(verses.slice(0, priorKnownVerseCount), Number.POSITIVE_INFINITY).length;
}
