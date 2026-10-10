"use client";

import { useEffect, useState } from "react";
import { ensurePericopesLoaded, getAllPericopesForChapter } from "@/lib/chapterPericopes";

// A chapter's theme for the Bible browser — its opening section heading, fetched for just the
// chapters on show (`chapters`); "Chapter N" until (or unless) one arrives.
export function useChapterThemes(book: string, chapters: number[]): (chapter: number) => string {
  const [, setLoaded] = useState(0);
  const key = `${book}|${chapters.join(",")}`;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      for (const chapter of key.split("|")[1].split(",").filter(Boolean).map(Number)) {
        if (getAllPericopesForChapter(book, chapter).length) continue;
        await ensurePericopesLoaded(book, chapter);
        if (cancelled) return;
        setLoaded((count) => count + 1);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [book, key]);

  return (chapter) => getAllPericopesForChapter(book, chapter)[0]?.heading ?? `Chapter ${chapter}`;
}
