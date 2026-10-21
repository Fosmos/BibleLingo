"use client";

import { useMemo } from "react";
import type { MemorizationDay, MemorizedEntity, PathProgress, VerseSegment } from "@/types";
import { useProgressStore } from "@/store/useProgressStore";
import { getAdjacentVerse } from "@/lib/chapterContent";
import { buildMemorizedVerseIndex } from "@/lib/memorizedVerseIndex";
import { getPericopeForVerse } from "@/lib/chapterPericopes";

// How far back the closing review goes when the verse's pericope isn't known (its data not loaded).
const REVIEW_BACK = 4;

// The learned verses from the start of a lesson's pericope up to its first verse, nearest last —
// [v5 … v8] for a lesson at v9 in a pericope starting at v5 — which the lesson reviews at the end,
// with the verse just learned (VerseLessonFlow.tsx); up to 4 when the pericope isn't known. Only
// verses the reader has already learned (the lesson's own previous verses, or anything memorized),
// counting back until one isn't: a path that starts mid-pericope never asks them to recall an
// unlearned verse before it. A translation's empty gap verse is stepped over, not a stop.
export function usePriorLearnedVerses(day: MemorizationDay): VerseSegment[] {
  const paths = useProgressStore((state) => state.paths);
  const entities = useProgressStore((state) => state.memorizedEntities);
  // Memoized: VerseLessonFlow.tsx builds the review day from it, which mustn't change every render.
  return useMemo(() => priorLearnedVerses(day, paths, entities), [day, paths, entities]);
}

function priorLearnedVerses(day: MemorizationDay, paths: Record<string, PathProgress>, entities: MemorizedEntity[]): VerseSegment[] {
  const first = day.newVerses.find((verse) => verse.text.trim().length > 0);
  if (!first) return [];
  const memorized = buildMemorizedVerseIndex(paths, entities).get(`${first.book}|${first.chapter}`);
  const learned = (verse: VerseSegment) => {
    const same = (other: VerseSegment) => other.book === verse.book && other.chapter === verse.chapter && other.verseNumber === verse.verseNumber;
    return Boolean(day.previousVerses?.some(same) || day.reviewVerses.some(same) || memorized?.has(verse.verseNumber));
  };
  const pericopeStart = getPericopeForVerse(first.book, first.chapter, first.verseNumber)?.startVerse;
  const prior: VerseSegment[] = [];
  let cursor = first;
  while (pericopeStart !== undefined ? cursor.verseNumber > pericopeStart : prior.length < REVIEW_BACK) {
    const before = getAdjacentVerse(cursor.book, cursor.chapter, cursor.verseNumber, -1);
    // Same chapter only: the lesson's page shows just this chapter's verses.
    if (!before || before.book !== first.book || before.chapter !== first.chapter) break;
    cursor = before;
    if (before.text.trim().length === 0) continue;
    if (!learned(before)) break;
    prior.unshift(before);
  }
  return prior;
}
