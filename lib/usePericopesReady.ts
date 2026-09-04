"use client";

import { useEffect, useState } from "react";
import type { VerseSegment } from "@/types";
import { ensurePericopesLoaded } from "@/lib/chapterPericopes";

// Waits for every distinct book/chapter's section headings in `verses` to be loaded (or to
// fail — never blocks forever) before reporting ready. Lesson chunking itself (see
// lib/chapterChunking.ts) no longer depends on this data, but everything downstream that
// reads a pericope for display or recitation — zone/section headings (lib/pathZones.ts),
// location-tag scoping, and the in-lesson heading-recall stages — needs this complete BEFORE
// it runs wherever a lesson gets shown to the user, so it renders consistently rather than
// popping in after the fact. A caller still waiting on its own `verses` (null) is trivially
// "not ready" too, the same not-yet-loaded state this mirrors.
export function usePericopesReady(verses: VerseSegment[] | null): boolean {
  // Tracks WHICH verses array the fetch has finished for, rather than a plain boolean, so
  // "ready" is a value derived at render time from comparing the two — the effect only ever
  // calls setState from its async .then() callback (a genuine external event), never
  // synchronously in the effect body itself.
  const [readyForVerses, setReadyForVerses] = useState<VerseSegment[] | null>(null);

  useEffect(() => {
    if (!verses || verses.length === 0) return;
    let cancelled = false;
    const keys = new Set(verses.map((verse) => `${verse.book}|${verse.chapter}`));
    Promise.all(
      Array.from(keys).map((key) => {
        const separatorIndex = key.lastIndexOf("|");
        const book = key.slice(0, separatorIndex);
        const chapter = Number(key.slice(separatorIndex + 1));
        return ensurePericopesLoaded(book, chapter);
      }),
    ).then(() => {
      if (!cancelled) setReadyForVerses(verses);
    });
    return () => {
      cancelled = true;
    };
  }, [verses]);

  if (!verses) return false;
  if (verses.length === 0) return true;
  return readyForVerses === verses;
}
