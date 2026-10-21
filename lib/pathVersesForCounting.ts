import type { VerseSegment } from "@/types";
import { findBook } from "@/lib/bibleBooks";
import { buildVerseSegments, getChapterVerses } from "@/lib/chapterContent";
import { getChapterVerseNumbers } from "@/lib/chapterVerseIndex";
import { parsePathKey, resolvePath } from "@/lib/memorizationContent";

// A book's verses for counting progress, where the text itself isn't needed: each chapter's cached
// verses, or — its text gone (the ESV's storage cap never lets a whole book stay cached) — stand-ins
// from its remembered verse numbers (lib/chapterVerseIndex.ts), a translation's gap verses left
// empty just as in its real text. Undefined while any chapter has never been loaded on this device.
export function getBookVerseOutline(book: string): VerseSegment[] | undefined {
  const outline: VerseSegment[] = [];
  for (let chapter = 1; chapter <= (findBook(book)?.chapterCount ?? 0); chapter++) {
    const cached = getChapterVerses(book, chapter);
    const numbers = cached ? undefined : getChapterVerseNumbers(book, chapter);
    if (!cached && !numbers?.length) return undefined;
    const known = new Set(numbers);
    outline.push(...(cached ?? buildVerseSegments(book, chapter, Array.from({ length: Math.max(...known) }, (_, index) => (known.has(index + 1) ? "…" : "")))));
  }
  return outline.length ? outline : undefined;
}

// A path's verses for counting what's learned on it (lib/progressSummary.ts, lib/memorizedVerseIndex.ts)
// — a book path's from its outline when its text isn't all cached.
export function pathVersesForCounting(key: string): VerseSegment[] | undefined {
  const resolved = resolvePath(key)?.verses;
  if (resolved) return resolved;
  const { kind, identifier } = parsePathKey(key);
  return kind === "book" && findBook(identifier) ? getBookVerseOutline(identifier) : undefined;
}
