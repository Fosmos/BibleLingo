"use client";

import { useMemo } from "react";
import type { MemorizationDay, MemorizedEntity, PathProgress, VerseSegment } from "@/types";
import { useProgressStore } from "@/store/useProgressStore";
import { getAdjacentVerse } from "@/lib/chapterContent";
import { buildMemorizedVerseIndex } from "@/lib/memorizedVerseIndex";

// How many verses before the lesson's own its closing review takes in.
const REVIEW_BACK = 4;

// Up to the 4 learned verses just before a lesson's first verse in its chapter, nearest last —
// [v5 … v8] for a lesson at v9 — which the lesson reviews at the end, with the verse just learned
// (VerseLessonFlow.tsx). Only verses the reader has already learned (the lesson's own previous
// verses, or anything memorized), counting back until one isn't: a path that starts mid-chapter
// never asks them to recall an unlearned verse before it.
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
  const prior: VerseSegment[] = [];
  let cursor = first;
  while (prior.length < REVIEW_BACK) {
    const before = getAdjacentVerse(cursor.book, cursor.chapter, cursor.verseNumber, -1);
    // Same chapter only: the lesson's page shows just this chapter's verses.
    if (!before || before.book !== first.book || before.chapter !== first.chapter || before.text.trim().length === 0 || !learned(before)) break;
    prior.unshift(before);
    cursor = before;
  }
  return prior;
}
