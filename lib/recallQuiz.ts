import type { MemorizedEntity, PathProgress } from "@/types";
import { findBook } from "@/lib/bibleBooks";
import { activePathScope } from "@/lib/mindMapPathTarget";
import { bookAbbreviation } from "@/lib/bibleRegions";

// The Path tab's Recall Quiz: a random verse you know, asked one of two ways — its reference
// (type the verse) or its text (type the reference).
export interface RecallItem {
  book: string;
  chapter: number;
  verseNumber: number;
  version: string;
}

export type RecallMode = "verse" | "reference";

// Every verse held (lib/memorizedVerseIndex.ts's book|chapter → verses), optionally just one
// book's, each with the translation it was learned in — its spaced-review range's, else the
// path's that covers it, else KJV.
export function buildRecallPool(index: Map<string, Set<number>>, entities: MemorizedEntity[], paths: Record<string, PathProgress>, book?: string): RecallItem[] {
  const pool: RecallItem[] = [];
  for (const [key, verses] of index) {
    const separator = key.lastIndexOf("|");
    const inBook = key.slice(0, separator);
    const chapter = Number(key.slice(separator + 1));
    if (book && inBook !== book) continue;
    for (const verseNumber of verses) {
      const entity = entities.find((candidate) => candidate.book === inBook && candidate.chapter === chapter && verseNumber >= candidate.startVerse && verseNumber <= candidate.endVerse);
      const pathKey = Object.keys(paths).find((candidate) => {
        const scope = activePathScope(candidate);
        return scope?.book === inBook && (scope.chapter === undefined || scope.chapter === chapter);
      });
      pool.push({ book: inBook, chapter, verseNumber, version: entity?.version ?? (pathKey ? paths[pathKey].version : "KJV") });
    }
  }
  return pool;
}

// A random question, never the same verse twice in a row (when there's a choice).
export function pickRecall(pool: RecallItem[], previous: RecallItem | null): { item: RecallItem; mode: RecallMode } | null {
  if (!pool.length) return null;
  const choices = pool.length > 1 && previous ? pool.filter((item) => !(item.book === previous.book && item.chapter === previous.chapter && item.verseNumber === previous.verseNumber)) : pool;
  const item = choices[Math.floor(Math.random() * choices.length)];
  return { item, mode: Math.random() < 0.5 ? "verse" : "reference" };
}

const squash = (text: string) => text.toLowerCase().replace(/[^a-z0-9]/g, "");

// Whether a typed reference names this verse — forgiving about spacing, punctuation and how the
// book is written: "Titus 1:6", "tit 1 6", "1 John 3:16", "1jn 3.16", "Psalm 23:1".
export function referenceMatches(input: string, item: RecallItem): boolean {
  const match = /^\s*(\d?\s*[a-z][a-z\s.]*?)\s*(\d+)\s*[\s:.,]\s*(\d+)\s*$/i.exec(input);
  if (!match) return false;
  const [, bookText, chapterText, verseText] = match;
  if (Number(chapterText) !== item.chapter || Number(verseText) !== item.verseNumber) return false;
  const typed = squash(bookText);
  const name = squash(item.book);
  const names = [name, squash(bookAbbreviation(item.book)), item.book === "Psalms" ? "psalm" : name];
  return typed.length >= 2 && Boolean(findBook(item.book)) && names.some((candidate) => candidate === typed || (typed.length >= 3 && candidate.startsWith(typed)));
}
