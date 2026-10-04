"use client";

import { useEffect, useState } from "react";
import type { MemorizedEntity } from "@/types";
import { getChapterVerses } from "@/lib/chapterContent";
import { getChapterVerseNumbers } from "@/lib/chapterVerseIndex";
import { ensureChapterLoaded } from "@/lib/bibleApiClient";

// The Memorized page's book/chapter counts need each memorized chapter's verse list cached (see
// lib/progressSummary.ts's computeMemorizedStats) — a whole book added by hand, or a chapter the
// cache has since dropped, otherwise silently doesn't count. Fetches any that are missing, one at
// a time, and returns a number that ticks up as each lands so the caller recomputes.
export function useMemorizedChaptersLoaded(entities: MemorizedEntity[]): number {
  const [loadedCount, setLoadedCount] = useState(0);

  useEffect(() => {
    const missing = new Map<string, MemorizedEntity>();
    for (const entity of entities) {
      const key = `${entity.book}|${entity.chapter}`;
      if (missing.has(key) || getChapterVerses(entity.book, entity.chapter)?.length || getChapterVerseNumbers(entity.book, entity.chapter)) continue;
      missing.set(key, entity);
    }
    if (missing.size === 0) return;
    let cancelled = false;
    (async () => {
      for (const entity of missing.values()) {
        if (cancelled) return;
        try {
          await ensureChapterLoaded(entity.book, entity.chapter, entity.version);
          if (!cancelled) setLoadedCount((count) => count + 1);
        } catch {
          // Offline or a failed fetch — that chapter just stays uncounted for now.
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [entities]);

  return loadedCount;
}
