"use client";

import { useMemo } from "react";
import type { MemorizationDay, MemorizedEntity, PathProgress, VerseSegment } from "@/types";
import { useProgressStore } from "@/store/useProgressStore";
import { getAdjacentVerse } from "@/lib/chapterContent";
import { buildMemorizedVerseIndex } from "@/lib/memorizedVerseIndex";
import { getPericopeForVerse } from "@/lib/chapterPericopes";

// The learned verses before a lesson's first verse in its pericope, nearest last — [v1 … v8] for a
// lesson at v9 of a pericope starting at v1 — which the lesson reviews first (learnSteps.ts's
// priorVerseIndices). Only verses the reader has already learned (the lesson's own previous
// verses, or anything memorized), counting back until one isn't: a path that starts mid-pericope
// never asks them to recall an unlearned verse before it. Without pericope data, the chapter.
export function usePriorLearnedVerses(day: MemorizationDay): VerseSegment[] {
  const paths = useProgressStore((state) => state.paths);
  const entities = useProgressStore((state) => state.memorizedEntities);
  // Memoized: VerseLessonFlow.tsx builds a review day from it, which mustn't change every render.
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
  const pericopeStart = getPericopeForVerse(first.book, first.chapter, first.verseNumber)?.startVerse ?? 1;
  const prior: VerseSegment[] = [];
  let cursor = first;
  for (;;) {
    const before = getAdjacentVerse(cursor.book, cursor.chapter, cursor.verseNumber, -1);
    // Same chapter and pericope only: the lesson's page shows just this chapter's verses.
    if (!before || before.book !== first.book || before.chapter !== first.chapter || before.verseNumber < pericopeStart || before.text.trim().length === 0 || !learned(before)) break;
    prior.unshift(before);
    cursor = before;
  }
  return prior;
}
