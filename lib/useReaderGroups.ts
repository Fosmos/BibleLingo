"use client";

import { useMemo } from "react";
import type { VerseSegment } from "@/types";
import { formatChapterLabel } from "@/lib/chapterContent";
import { useChapterPathGroups, type ChapterPathGroup } from "@/lib/useChapterPathGroups";

const CHUNK = 10;

// The chapter reader's groups: one per pericope (lib/useChapterPathGroups.ts), or — for a chapter
// with no headings — runs of ten verses titled "Verses 1–10".
export function useReaderGroups(book: string, chapter: number, verses: VerseSegment[]): ChapterPathGroup[] {
  const groups = useChapterPathGroups(book, chapter, verses);
  return useMemo(() => {
    const untitled = groups.length === 1 && groups[0].heading === formatChapterLabel(book, chapter) && groups[0].verses.length > CHUNK;
    if (!untitled) return groups;
    const all = groups[0].verses;
    return Array.from({ length: Math.ceil(all.length / CHUNK) }, (_, index) => {
      const run = all.slice(index * CHUNK, (index + 1) * CHUNK);
      const [first, last] = [run[0].verseNumber, run[run.length - 1].verseNumber];
      return { ...groups[0], key: `${first}`, range: `${chapter}:${first}–${last}`, heading: `Verses ${first}–${last}`, verses: run };
    });
  }, [groups, book, chapter]);
}
