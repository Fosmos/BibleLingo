import type { MemorizedEntity } from "@/types";
import { getCachedPericopes } from "@/lib/pericopeCache";

// Spaced review goes by pericope: a review range never runs past a pericope's heading, so each
// passage is reviewed (and scheduled) on its own. This is which passage a verse belongs to — the
// first verse of its pericope, or 0 for verses before the chapter's first heading — and null while
// the chapter's headings aren't in the local cache yet (lib/chapterPericopes.ts), when ranges fall
// back to growing across the chapter until the headings arrive and split them.
export function pericopeGroupOf(book: string, chapter: number, verseNumber: number): number | null {
  const pericopes = getCachedPericopes(book, chapter);
  if (!pericopes?.length) return null;
  return pericopes.reduce((start, pericope) => (pericope.startVerse <= verseNumber ? pericope.startVerse : start), 0);
}

// Whether two verses of a chapter may share a review range.
export const samePericope = (book: string, chapter: number, a: number, b: number) => pericopeGroupOf(book, chapter, a) === pericopeGroupOf(book, chapter, b);

// Splits every range that crosses a pericope heading into one range per pericope, each keeping the
// original's schedule, history and dates (so nothing is due sooner than it was). Returns the same
// array when nothing needed splitting.
export function splitEntitiesByPericope(entities: MemorizedEntity[]): MemorizedEntity[] {
  let changed = false;
  const split = entities.flatMap((entity) => {
    const { book, chapter, startVerse, endVerse } = entity;
    if (pericopeGroupOf(book, chapter, startVerse) === null) return [entity];
    const parts: MemorizedEntity[] = [];
    let from = startVerse;
    for (let verse = startVerse + 1; verse <= endVerse + 1; verse++) {
      if (verse <= endVerse && samePericope(book, chapter, from, verse)) continue;
      parts.push({ ...entity, id: `${book}|${chapter}|${from}-${verse - 1}`, startVerse: from, endVerse: verse - 1 });
      from = verse;
    }
    if (parts.length === 1) return [entity];
    changed = true;
    return parts;
  });
  return changed ? split : entities;
}
