"use client";

import { useEffect, useState } from "react";
import { ensurePericopesLoaded, getPericopeForVerse } from "@/lib/chapterPericopes";

// This verse's own pericope heading (e.g. "Thanksgiving and Prayer") — undefined until
// pericope data for this book/chapter is cached (see ensurePericopesLoaded), then re-renders
// once it lands. Pulled out of VerseReferenceHeader.tsx so LessonVerseContext.tsx can show
// the exact same heading text a lesson's own parchment needs, without duplicating the
// load-then-look-up dance. Decorative, never blocking — a failed/missing pericope just means
// no heading shows.
export function usePericopeHeading(book: string, chapter: number, verseNumber: number): string | undefined {
  const [, setLoadTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    ensurePericopesLoaded(book, chapter).then(() => {
      if (!cancelled) setLoadTick((tick) => tick + 1);
    });
    return () => {
      cancelled = true;
    };
  }, [book, chapter]);

  return getPericopeForVerse(book, chapter, verseNumber)?.heading;
}
