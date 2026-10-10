"use client";

import { useMemo } from "react";
import { useProgressStore } from "@/store/useProgressStore";
import { buildMemorizedVerseIndex } from "@/lib/memorizedVerseIndex";
import { buildMemoryIndex, countHeld, stateOf, type MemoryCounts, type MemoryState } from "@/lib/verseMemoryState";

export interface VerseMemory {
  stateOf: (book: string, chapter: number, verse: number) => MemoryState;
  book: (book: string) => MemoryCounts;
  chapter: (book: string, chapter: number) => MemoryCounts;
  // The due verses among a chapter's first `length`.
  dueVerses: (book: string, chapter: number, length: number) => number[];
}

// Every verse's memory state (lib/verseMemoryState.ts), memoised over the store — the Path tab's
// shelves, chapter drawer and pericope cards all read it.
export function useVerseMemory(): VerseMemory {
  const paths = useProgressStore((state) => state.paths);
  const entities = useProgressStore((state) => state.memorizedEntities);
  return useMemo(() => {
    const index = buildMemoryIndex(entities, buildMemorizedVerseIndex(paths, entities), new Date());
    return {
      stateOf: (book, chapter, verse) => stateOf(index, book, chapter, verse),
      book: (book) => countHeld(index, book),
      chapter: (book, chapter) => countHeld(index, book, chapter),
      dueVerses: (book, chapter, length) => Array.from({ length }, (_, i) => i + 1).filter((verse) => stateOf(index, book, chapter, verse) === "due"),
    };
  }, [paths, entities]);
}

// Fills per state — spines, trails and the legend.
export const STATE_FILL: Record<MemoryState, string> = {
  rooted: "bg-sage-600",
  growing: "bg-sage-300",
  due: "bg-brand-500",
  open: "bg-sand-300",
};
