import type { VerseSegment } from "@/types";
import type { TrailSection } from "@/lib/trailStops";
import type { ParsedVerseKey } from "@/lib/verseKey";

export const STORYBOARD_COLUMNS = 5;

// A verse's row in its path's storyboard (BookStructureScreen.tsx), exactly as it is there: worked out
// from the same sections — the verses of the passages that start in its chapter, so a path that starts
// mid-chapter counts from where it starts. Five verses, or fewer on a short last row.
export function storyboardRow(sections: TrailSection[], place: ParsedVerseKey): VerseSegment[] {
  const passages = sections.flatMap((section) => {
    const verses = section.stops.flatMap((stop) => (stop.verse ? [stop.verse] : []));
    return !section.review && verses.length ? [verses] : [];
  });
  const isPlace = (verse: VerseSegment) => verse.book === place.book && verse.chapter === place.chapter && verse.verseNumber === place.verseNumber;
  const own = passages.find((verses) => verses.some(isPlace));
  if (!own) return [];
  const chapter = passages.filter((verses) => verses[0].chapter === own[0].chapter).flat();
  const at = chapter.findIndex(isPlace);
  const start = at - (at % STORYBOARD_COLUMNS);
  return chapter.slice(start, start + STORYBOARD_COLUMNS);
}
