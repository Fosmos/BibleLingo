"use client";

import { useMemo } from "react";
import { useProgressStore } from "@/store/useProgressStore";
import { buildMemorizedVerseIndex } from "@/lib/memorizedVerseIndex";
import { isDue } from "@/lib/srs";

export interface BibleHeld {
  // Verses memorized in a book, or in one of its chapters.
  heldIn: (book: string, chapter?: number) => number;
  isLearned: (book: string, chapter: number, verseNumber: number) => boolean;
  // A book with a spaced review due right now.
  hasDue: (book: string) => boolean;
}

// Every verse the reader holds (lib/memorizedVerseIndex.ts — spaced review, any path, prior-known
// verses), counted the ways the Path tab's Bible browser shows them.
export function useBibleHeld(): BibleHeld {
  const paths = useProgressStore((state) => state.paths);
  const entities = useProgressStore((state) => state.memorizedEntities);

  return useMemo(() => {
    const index = buildMemorizedVerseIndex(paths, entities);
    const perBook = new Map<string, number>();
    for (const [key, verses] of index) {
      const book = key.slice(0, key.lastIndexOf("|"));
      perBook.set(book, (perBook.get(book) ?? 0) + verses.size);
    }
    const now = new Date();
    const due = new Set(entities.filter((entity) => isDue(entity.srs, now)).map((entity) => entity.book));
    return {
      heldIn: (book, chapter) => (chapter === undefined ? (perBook.get(book) ?? 0) : (index.get(`${book}|${chapter}`)?.size ?? 0)),
      isLearned: (book, chapter, verseNumber) => index.get(`${book}|${chapter}`)?.has(verseNumber) ?? false,
      hasDue: (book) => due.has(book),
    };
  }, [paths, entities]);
}
