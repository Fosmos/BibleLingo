"use client";

import type { MemorizationDay, VerseSegment } from "@/types";
import { useProgressStore } from "@/store/useProgressStore";
import { getAdjacentVerse } from "@/lib/chapterContent";
import { buildMemorizedVerseIndex } from "@/lib/memorizedVerseIndex";

// The verse just before a lesson's first verse — which every one of its cumulative "Remember"
// checks starts with (see lib/learnSteps.ts's PRIOR_VERSE_INDEX) — but only when it's one the
// reader has already learned: the lesson's own previous verses, or anything they've memorized.
// A path that starts mid-chapter never asks them to recall the unlearned verse before it.
export function usePriorLearnedVerse(day: MemorizationDay): VerseSegment | undefined {
  const paths = useProgressStore((state) => state.paths);
  const entities = useProgressStore((state) => state.memorizedEntities);
  const first = day.newVerses.find((verse) => verse.text.trim().length > 0);
  const prior = first ? getAdjacentVerse(first.book, first.chapter, first.verseNumber, -1) : undefined;
  // Same chapter only: the lesson's page shows just this chapter's verses.
  if (!prior || !first || prior.book !== first.book || prior.chapter !== first.chapter || prior.text.trim().length === 0) return undefined;
  const same = (verse: VerseSegment) => verse.book === prior.book && verse.chapter === prior.chapter && verse.verseNumber === prior.verseNumber;
  if (day.previousVerses?.some(same) || day.reviewVerses.some(same)) return prior;
  const memorized = buildMemorizedVerseIndex(paths, entities).get(`${prior.book}|${prior.chapter}`);
  return memorized?.has(prior.verseNumber) ? prior : undefined;
}
