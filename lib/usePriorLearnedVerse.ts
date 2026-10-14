"use client";

import type { MemorizationDay, VerseSegment } from "@/types";
import { useProgressStore } from "@/store/useProgressStore";
import { getAdjacentVerse } from "@/lib/chapterContent";
import { buildMemorizedVerseIndex } from "@/lib/memorizedVerseIndex";

// How many learned verses before a lesson its rolling cumulative checks reach back to (see
// lib/learnSteps.ts) — each check is a verse plus the three before it.
const PRIOR_REACH = 3;

// The learned verses just before a lesson's first verse, nearest last — [v7, v8] for a lesson
// starting at v9 — which its first cumulative "Remember" checks start from (see learnSteps.ts's
// PRIOR_VERSE_INDICES). Only verses the reader has already learned (the lesson's own previous
// verses, or anything memorized), in the same chapter, counting back until one isn't: a path that
// starts mid-chapter never asks them to recall an unlearned verse before it.
export function usePriorLearnedVerses(day: MemorizationDay): VerseSegment[] {
  const paths = useProgressStore((state) => state.paths);
  const entities = useProgressStore((state) => state.memorizedEntities);
  const first = day.newVerses.find((verse) => verse.text.trim().length > 0);
  if (!first) return [];
  const memorized = buildMemorizedVerseIndex(paths, entities).get(`${first.book}|${first.chapter}`);
  const learned = (verse: VerseSegment) => {
    const same = (other: VerseSegment) => other.book === verse.book && other.chapter === verse.chapter && other.verseNumber === verse.verseNumber;
    return Boolean(day.previousVerses?.some(same) || day.reviewVerses.some(same) || memorized?.has(verse.verseNumber));
  };
  const prior: VerseSegment[] = [];
  let cursor = first;
  while (prior.length < PRIOR_REACH) {
    const before = getAdjacentVerse(cursor.book, cursor.chapter, cursor.verseNumber, -1);
    // Same chapter only: the lesson's page shows just this chapter's verses.
    if (!before || before.book !== first.book || before.chapter !== first.chapter || before.text.trim().length === 0 || !learned(before)) break;
    prior.unshift(before);
    cursor = before;
  }
  return prior;
}
