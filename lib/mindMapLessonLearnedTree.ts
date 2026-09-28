"use client";

import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import type { MemorizedEntity } from "@/types";
import type { MindMapDatum, MindMapRootDatum } from "@/lib/mindMapHierarchy";
import type { ChapterNode } from "@/lib/useMindMapData";
import { LEARNED_VERSE_COUNT_FIELD } from "@/lib/useRecordLearnedVerseCount";
import { useProgressStore } from "@/store/useProgressStore";

// Every verse an unfinished lesson of `pathKey` has already got through (see
// lib/useRecordLearnedVerseCount.ts), as sorted `${book}:${chapter}:${verse}` keys — a stable,
// comparable list, so the store subscription below only re-renders when it actually changes.
function lessonLearnedKeys(pathKey: string | null, chapters: ChapterNode[], checkpoints: Record<string, Record<string, number>>): string[] {
  if (!pathKey) return [];
  const keys: string[] = [];
  for (const day of chapters.flatMap((chapter) => chapter.days)) {
    const count = checkpoints[`${pathKey}:${day.dayNumber}`]?.[LEARNED_VERSE_COUNT_FIELD] ?? 0;
    for (const verse of day.newVerses.slice(0, count)) keys.push(`${verse.book}:${verse.chapter}:${verse.verseNumber}`);
  }
  return keys.sort();
}

function withLearned<T extends MindMapDatum>(datum: T, lessonKeys: Set<string>, entities: MemorizedEntity[]): T {
  if (datum.kind === "pericope") {
    const { book, chapter, rangeStartVerse: start, rangeEndVerse: end } = datum;
    if (start === undefined || end === undefined) return datum;
    const learned = new Set(datum.learnedVerses ?? []);
    for (let verse = start; verse <= end; verse++) {
      if (lessonKeys.has(`${book}:${chapter}:${verse}`)) learned.add(verse);
    }
    for (const entity of entities) {
      if (entity.book !== book || entity.chapter !== chapter) continue;
      for (let verse = Math.max(start, entity.startVerse); verse <= Math.min(end, entity.endVerse); verse++) learned.add(verse);
    }
    if (learned.size === (datum.learnedVerses?.length ?? 0)) return datum;
    return { ...datum, learnedVerses: [...learned].sort((a, b) => a - b) };
  }
  if (!("children" in datum) || !datum.children) return datum;
  return { ...datum, children: (datum.children as MindMapDatum[]).map((child) => withLearned(child, lessonKeys, entities)) };
}

// The Mind Map tree with every verse the reader has memorized checked off, verse by verse:
// - verses an unfinished lesson of the drawn path has already got through — straight away, not
//   only once the whole day completes (read from the lesson's saved checkpoint, so it holds after
//   leaving the lesson half-way too);
// - every verse in spaced review (memorizedEntities) — whichever path learned it, so a verse
//   memorized on its own, or by another of the reader's paths, shows on this map too.
export function useMindMapLessonLearnedTree(tree: MindMapRootDatum, chapters: ChapterNode[], pathKey: string | null): MindMapRootDatum {
  const lessonKeys = useProgressStore(useShallow((state) => lessonLearnedKeys(pathKey, chapters, state.sessionCheckpoints)));
  const entities = useProgressStore((state) => state.memorizedEntities);
  return useMemo(() => {
    if (lessonKeys.length === 0 && entities.length === 0) return tree;
    return withLearned(tree, new Set(lessonKeys), entities);
  }, [tree, lessonKeys, entities]);
}
