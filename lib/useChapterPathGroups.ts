"use client";

import { useEffect, useMemo, useState } from "react";
import type { VerseSegment } from "@/types";
import { ensurePericopesLoaded, getAllPericopesForChapter, type PericopeInfo } from "@/lib/chapterPericopes";
import { formatChapterLabel } from "@/lib/chapterContent";
import { pericopeColour, type PericopeColour } from "@/lib/chapterPathPalette";

export interface ChapterPathGroup {
  key: string;
  // e.g. "8:1–4"
  range: string;
  heading: string;
  colour: PericopeColour;
  verses: VerseSegment[];
}

// A chapter's verses split into its pericopes (one group, titled with the chapter, when it has
// none), each with its colour from lib/chapterPathPalette.ts — the Chapter Path View's boxes.
export function useChapterPathGroups(book: string, chapter: number, verses: VerseSegment[]): ChapterPathGroup[] {
  const [pericopes, setPericopes] = useState<PericopeInfo[]>(() => getAllPericopesForChapter(book, chapter));

  useEffect(() => {
    let cancelled = false;
    ensurePericopesLoaded(book, chapter).then(() => {
      if (!cancelled) setPericopes(getAllPericopesForChapter(book, chapter));
    });
    return () => {
      cancelled = true;
    };
  }, [book, chapter]);

  return useMemo(() => {
    const last = verses[verses.length - 1]?.verseNumber ?? 1;
    const first = verses[0]?.verseNumber ?? 1;
    const spans = pericopes.length
      ? pericopes.map((pericope) => ({ start: pericope.startVerse, end: pericope.endVerse, heading: pericope.heading }))
      : [{ start: first, end: last, heading: formatChapterLabel(book, chapter) }];
    // Verses before the chapter's first heading still get a box of their own.
    if (spans[0].start > first) spans.unshift({ start: first, end: spans[0].start - 1, heading: formatChapterLabel(book, chapter) });
    return spans
      .map((span, index) => ({
        key: `${span.start}`,
        range: span.start === span.end ? `${chapter}:${span.start}` : `${chapter}:${span.start}–${span.end}`,
        heading: span.heading,
        colour: pericopeColour(index),
        verses: verses.filter((verse) => verse.verseNumber >= span.start && verse.verseNumber <= span.end && verse.text.trim().length > 0),
      }))
      .filter((group) => group.verses.length > 0);
  }, [pericopes, verses, book, chapter]);
}
