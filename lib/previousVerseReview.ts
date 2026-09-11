import type { VerseSegment } from "@/types";
import { getPericopeForVerse } from "@/lib/chapterPericopes";

// Extends "yesterday's own lesson" (previousChunk) back to the start of whichever pericope
// its own first verse belongs to — used only when a path has Memory Palace's Pegs on for the
// pericope scope (see PathProgress.locationTagLevels/UserProgress.pegSystemEnabled), since a
// pericope's peg is keyed to its own start verse (see lib/pegSystem.ts/BuildingRoomView.tsx):
// reviewing from there, not just from wherever yesterday's chunk happened to begin, keeps the
// peg-to-verse association meaningful even once a lesson is many verses deep into a section.
// Runs through everything learned in that pericope so far — from its start verse through
// wherever the reader actually got to as of yesterday (previousChunk's own last verse), which
// may reach back further than just yesterday's chunk for a pericope that took several lessons.
// `verses` is this path's full ordered verse list (a single chapter for chapter/verse/topic
// paths; book mode's whole multi-chapter list, filtered here to previousChunk's own book +
// chapter). Falls back to previousChunk unchanged whenever there's nothing to extend (a
// path's first lesson) or this chapter's pericope data isn't cached yet — decorative, never a
// blocking dependency, same convention every other pericope consumer in this codebase follows.
export function pericopeAnchoredPreviousVerses(
  verses: VerseSegment[],
  previousChunk: VerseSegment[],
  usePericopeAnchor: boolean,
): VerseSegment[] {
  if (!usePericopeAnchor || previousChunk.length === 0) return previousChunk;

  const first = previousChunk[0];
  const pericope = getPericopeForVerse(first.book, first.chapter, first.verseNumber);
  if (!pericope) return previousChunk;

  const last = previousChunk[previousChunk.length - 1];
  return verses.filter(
    (verse) =>
      verse.book === first.book &&
      verse.chapter === first.chapter &&
      verse.verseNumber >= pericope.startVerse &&
      verse.verseNumber <= last.verseNumber,
  );
}
