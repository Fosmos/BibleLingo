"use client";

import { useEffect, useMemo, useState } from "react";
import type { MemorizedEntity } from "@/types";
import { ensureChapterLoaded } from "@/lib/bibleApiClient";
import { ensurePericopesLoaded, getAllPericopesForChapter } from "@/lib/chapterPericopes";
import { getChapterVerses } from "@/lib/chapterContent";
import { shelfChapter, shelfChapters } from "@/lib/memorizedShelf";
import type { RingChapter } from "@/lib/verseRings";

// A Memorized book's chapters for its one-page view (BookChaptersList.tsx): every chapter, and each
// with anything memorized in it filled out with its sections and verses once its text and headings
// have loaded (fetched here, a chapter at a time).
export function useShelfBookChapters(book: string, chapterCount: number, entities: MemorizedEntity[], stumbles: Record<string, number[]>, now: Date): RingChapter[] {
  const [loaded, setLoaded] = useState(0);
  const started = useMemo(() => [...new Set(entities.filter((entity) => entity.book === book).map((entity) => entity.chapter))].sort((a, b) => a - b), [entities, book]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      for (const chapter of started) {
        const version = entities.find((entity) => entity.book === book && entity.chapter === chapter)?.version ?? "KJV";
        try {
          await Promise.all([ensureChapterLoaded(book, chapter, version), ensurePericopesLoaded(book, chapter).catch(() => undefined)]);
        } catch {
          // A chapter that can't load stays one line.
        }
        if (!cancelled) setLoaded((count) => count + 1);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [book, started, entities]);

  return useMemo(() => {
    void loaded;
    return shelfChapters(book, chapterCount, entities, now).map((chapter) => {
      const verses = started.includes(chapter.chapter) ? getChapterVerses(book, chapter.chapter)?.filter((verse) => verse.text.trim()) : undefined;
      const full = verses?.length ? shelfChapter(verses, getAllPericopesForChapter(book, chapter.chapter), entities, stumbles, now) : undefined;
      return full ?? chapter;
    });
  }, [book, chapterCount, entities, stumbles, now, started, loaded]);
}
