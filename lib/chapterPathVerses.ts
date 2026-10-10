import type { VerseSegment } from "@/types";
import { getChapterVerses } from "@/lib/chapterContent";
import { getCachedChapterVersion } from "@/lib/bibleContentCache";

// The whole chapter for the Chapter Path View — from the cache when it holds this path's
// translation (a verse path only carries its own few verses), else the path's own verses.
export function chapterPathVerses(pathVerses: VerseSegment[], book: string, chapter: number, version: string): VerseSegment[] {
  const cached = getChapterVerses(book, chapter);
  if (cached?.length && getCachedChapterVersion(book, chapter) === version) return cached;
  return pathVerses.filter((verse) => verse.book === book && verse.chapter === chapter);
}
