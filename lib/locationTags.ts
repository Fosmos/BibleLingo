import type { LocationTagLevel } from "@/types";

// A single scope a location tag can be attached to — one of each level per unique location:
// a whole book, one chapter, one pericope (by its own label, e.g. "Mark 1:1-8"), or one verse.
export type LocationTagScope =
  | { level: "book"; book: string }
  | { level: "chapter"; book: string; chapter: number }
  | { level: "pericope"; book: string; chapter: number; pericopeLabel: string }
  | { level: "verse"; book: string; chapter: number; verseNumber: number };

// Stable key for UserProgress.locationTags — one flat map across every level, so a book tag
// and a verse tag for the very same book never collide.
export function locationTagKey(scope: LocationTagScope): string {
  switch (scope.level) {
    case "book":
      return `book|${scope.book}`;
    case "chapter":
      return `chapter|${scope.book}|${scope.chapter}`;
    case "pericope":
      return `pericope|${scope.book}|${scope.chapter}|${scope.pericopeLabel}`;
    case "verse":
      return `verse|${scope.book}|${scope.chapter}|${scope.verseNumber}`;
  }
}

export const LOCATION_TAG_LEVEL_LABELS: Record<LocationTagLevel, string> = {
  book: "Book",
  chapter: "Chapter",
  pericope: "Pericope",
  verse: "Verse",
};
