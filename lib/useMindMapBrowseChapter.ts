"use client";

import { useEffect, useState } from "react";
import { ensureChapterLoaded } from "@/lib/bibleApiClient";
import { ensurePericopesLoaded } from "@/lib/chapterPericopes";

// Fires the two fetches needed to browse a single NON-active book's single chapter (its verses,
// for the pericope-endVerse lookup lib/chapterPericopes.ts's buildPericopeInfo falls back to,
// plus its section headings) — the one piece of remote data lib/mindMapBrowseTree.ts can't get
// from already-in-memory static shells (lib/bibleBooks.ts, lib/canonTree.ts) alone. Mirrors
// CAFD's own "only the open branch's own frontier is ever real" rule (see
// lib/mindMapActivePath.ts): at most one non-active book/chapter pair is ever open across the
// whole canvas at once, so this only ever needs to track one, not a whole cache of them. Returns
// a plain tick that bumps once both fetches resolve — BookMindMap.tsx folds it into its own
// tree-building useMemo's dependency list so the tree recomputes (now reading real cached data)
// once loading finishes, the same "cheap sync re-derivation off a cache the fetch just filled"
// pattern every other pericope consumer in this codebase already follows.
export function useMindMapBrowseChapter(book: string | null, chapter: number | null, version: string): number {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!book || !chapter || !version) return;
    let cancelled = false;
    Promise.all([ensureChapterLoaded(book, chapter, version), ensurePericopesLoaded(book, chapter)])
      .then(() => {
        if (!cancelled) setTick((value) => value + 1);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [book, chapter, version]);

  return tick;
}
