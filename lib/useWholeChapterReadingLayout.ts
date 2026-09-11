"use client";

import { useMemo } from "react";
import type { MemorizationDay, VerseSegment } from "@/types";
import { useChapterReadingLayout, type ChapterReadingLayout } from "@/lib/useChapterReadingLayout";

// SRS review's own way to reuse the SAME real chapter pages/pagination/font-size the reading
// view and Learn flow compute (see useChapterReadingLayout.ts's own doc comment) — a review
// entity has no "day plan" of its own (it's just a book+chapter+verse range, possibly a merge
// of several original lessons, or a manual entry with no lesson history at all), so this wraps
// the WHOLE chapter's own already-fetched verses (never just the entity's own slice — see
// SrsReviewSession.tsx) in one synthetic "learn day" instead. Pagination itself only ever
// depends on the full verse set + segments + viewport (see useChapterPagination.ts), never on
// how days are chunked, so this produces the exact same pages/font-size the real reading view
// would for this chapter regardless of which original lesson(s) actually taught it.
// `completedDays` is fixed at 1 and `todaysDay` at 0 (never a real day number) so every verse
// renders in its "completed" (orange-underlined, already-memorized) state — never today's gold
// highlight, which belongs to the Learn flow, not review.
export function useWholeChapterReadingLayout(chapterVerses: VerseSegment[]): ChapterReadingLayout {
  const days = useMemo<MemorizationDay[]>(
    () => (chapterVerses.length > 0 ? [{ dayNumber: 1, kind: "learn", newVerses: chapterVerses, reviewVerses: [] }] : []),
    [chapterVerses],
  );
  return useChapterReadingLayout(days, 1, 0);
}
