"use client";

import { useEffect, useState } from "react";
import type { VerseSegment } from "@/types";
import { getChapterVerses } from "@/lib/chapterContent";
import { getCachedChapterVersion } from "@/lib/bibleContentCache";
import { ensureChapterLoaded, BibleFetchError } from "@/lib/bibleApiClient";

export interface ChapterText {
  verses: VerseSegment[] | null;
  error: string | null;
}

// Any chapter's text in `version` for the Path tab's chapter view — from the cache when it holds
// that translation, otherwise fetched. `skip` when the caller already has the verses (the path's own chapters).
export function useChapterText(book: string, chapter: number, version: string, skip: boolean): ChapterText {
  const cachedNow = () => (getCachedChapterVersion(book, chapter) === version ? (getChapterVerses(book, chapter) ?? null) : null);
  const [loaded, setLoaded] = useState<{ key: string; verses: VerseSegment[] | null; error: string | null }>({ key: "", verses: null, error: null });
  const key = `${book}|${chapter}|${version}`;

  useEffect(() => {
    if (skip) return;
    let cancelled = false;
    ensureChapterLoaded(book, chapter, version)
      .then((verses) => !cancelled && setLoaded({ key, verses, error: null }))
      .catch((err) => !cancelled && setLoaded({ key, verses: null, error: err instanceof BibleFetchError ? err.message : "Couldn't load this chapter." }));
    return () => {
      cancelled = true;
    };
  }, [book, chapter, version, key, skip]);

  if (skip) return { verses: null, error: null };
  if (loaded.key === key) return { verses: loaded.verses, error: loaded.error };
  return { verses: cachedNow(), error: null };
}
