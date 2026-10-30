import type { MemorizedEntity, VerseSegment } from "@/types";
import { boxDisplayNumber } from "@/lib/srs";
import type { TrailSection, TrailStop } from "@/lib/trailStops";
import { verseKey } from "@/lib/verseKey";

// How well a verse is holding: 0 not memorized, up to 4.
export type VerseStrength = 0 | 1 | 2 | 3 | 4;
export const STRENGTH_LABELS: Record<VerseStrength, string> = { 0: "Not memorized", 1: "Fragile", 2: "Growing", 3: "Strong", 4: "Solid" };

export interface GridTile {
  stop: TrailStop;
  verse: VerseSegment;
  entity?: MemorizedEntity;
  strength: VerseStrength;
  due: boolean;
  next: boolean;
  passage: number;
}

export interface GridPassage {
  section: TrailSection;
  // Its place among the chapter's passages.
  number: number;
  reviews: TrailStop[];
}

export interface GridChapter {
  chapter: number;
  book: string;
  tiles: GridTile[];
  passages: GridPassage[];
  reviews: TrailStop[];
  known: number;
  due: number;
  hasNext: boolean;
}

export interface BookGrid {
  chapters: GridChapter[];
  // A path's closing reviews, after its last chapter.
  finale: TrailStop[];
  next: TrailStop | null;
  known: number;
  total: number;
  dueIds: string[];
}

// Missed this many words overall, a verse reads one step weaker than its range.
const SHAKY_MISSES = 3;

// Review boxes belong to whole ranges, so a verse's own missed words tell it apart from its neighbours.
export function strengthOf(entity: MemorizedEntity | undefined, misses: number): VerseStrength {
  if (!entity) return 0;
  const box = boxDisplayNumber(entity.srs.box);
  const base = box >= 6 ? 4 : box >= 4 ? 3 : box >= 2 ? 2 : 1;
  return Math.max(1, misses >= SHAKY_MISSES ? base - 1 : base) as VerseStrength;
}

// A verse's strength, from its range's review box and its own missed words.
export function verseStrength(verse: VerseSegment, entity: MemorizedEntity | undefined, learned: boolean, stumbles: Record<string, number[]>): VerseStrength {
  const misses = (stumbles[verseKey(verse.book, verse.chapter, verse.verseNumber)] ?? []).reduce((sum, count) => sum + count, 0);
  return strengthOf(entity ?? (learned ? ({ srs: { box: 1 } } as MemorizedEntity) : undefined), misses);
}

export function firstWord(text: string): string {
  const word = text.trim().split(/\s+/)[0];
  return word.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "") || word;
}

// A book or chapter path's trail, regrouped by chapter for the Path view (BookGridScreen.tsx).
export function buildBookGrid(sections: TrailSection[], entities: MemorizedEntity[], stumbles: Record<string, number[]>): BookGrid {
  const chapters = new Map<number, GridChapter>();
  const finale: TrailStop[] = [];
  const next = sections.flatMap((section) => section.stops).find((stop) => stop.state === "current") ?? null;
  let lastPassage: GridPassage | undefined;
  for (const section of sections) {
    const reviewStops = section.stops.filter((stop) => !stop.verse);
    if (section.reviewOf === "pericope" && lastPassage) lastPassage.reviews.push(...reviewStops);
    else if (section.reviewOf === "chapter") {
      const chapter = reviewStops[0]?.review?.chapter;
      const home = chapter === undefined ? undefined : chapters.get(chapter);
      if (home) home.reviews.push(...reviewStops);
      else finale.push(...reviewStops);
    } else if (!section.stops.some((stop) => stop.verse)) finale.push(...reviewStops);
    else {
      const first = section.stops.find((stop) => stop.verse)!.verse!;
      const home = chapters.get(first.chapter) ?? { chapter: first.chapter, book: first.book, tiles: [], passages: [], reviews: [], known: 0, due: 0, hasNext: false };
      chapters.set(first.chapter, home);
      lastPassage = { section, number: home.passages.length, reviews: reviewStops };
      home.passages.push(lastPassage);
      section.stops.forEach((stop) => {
        const verse = stop.verse;
        if (!verse) return;
        const entity = entities.find((candidate) => candidate.book === verse.book && candidate.chapter === verse.chapter && candidate.startVerse <= verse.verseNumber && candidate.endVerse >= verse.verseNumber);
        const strength = verseStrength(verse, entity, stop.state === "done", stumbles);
        const due = stop.dueIds.length > 0;
        const isNext = stop === next;
        home.tiles.push({ stop, verse, entity, strength, due, next: isNext, passage: lastPassage!.number });
        if (strength > 0) home.known++;
        if (due) home.due++;
        if (isNext) home.hasNext = true;
      });
    }
    if (next && reviewStops.includes(next) && next.review) {
      const home = chapters.get(next.review.chapter);
      if (home) home.hasNext = true;
    }
  }
  const list = [...chapters.values()];
  const tiles = list.flatMap((chapter) => chapter.tiles);
  return {
    chapters: list,
    finale,
    next,
    known: tiles.filter((tile) => tile.strength > 0).length,
    total: tiles.length,
    dueIds: [...new Set(tiles.flatMap((tile) => tile.stop.dueIds))],
  };
}
