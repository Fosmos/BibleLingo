import type { MindMapChapterDatum } from "@/lib/mindMapTypes";
import { chapterMemorizedFraction, type MemorizedVerseIndex } from "@/lib/memorizedVerseIndex";

// A Mind Map chapter with everything the reader has memorized in it marked — its ring's
// `memorizedFraction` and each hall's learned verses — whichever path (or none) the map is
// drawing, so progress shows the same in every view of the map.
export function withMemorized(chapter: MindMapChapterDatum, index: MemorizedVerseIndex): MindMapChapterDatum {
  const verses = index.get(`${chapter.book}|${chapter.chapter}`);
  const memorizedFraction = chapterMemorizedFraction(index, chapter.book, chapter.chapter);
  if (!verses) return { ...chapter, memorizedFraction };
  const children = chapter.children.map((hall) => {
    const { rangeStartVerse: start, rangeEndVerse: end } = hall;
    if (start === undefined || end === undefined) return hall;
    const learned = new Set(hall.learnedVerses ?? []);
    for (const verse of verses) if (verse >= start && verse <= end) learned.add(verse);
    return learned.size === (hall.learnedVerses?.length ?? 0) ? hall : { ...hall, learnedVerses: [...learned].sort((a, b) => a - b) };
  });
  return { ...chapter, memorizedFraction, children };
}
