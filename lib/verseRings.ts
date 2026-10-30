import type { MemorizedEntity, SRSState, VerseSegment } from "@/types";
import { verseStrength, type VerseStrength } from "@/lib/bookGrid";
import { BOX_INTERVAL_DAYS, isDue } from "@/lib/srs";
import type { TrailSection, TrailStop } from "@/lib/trailStops";

const DAY_MS = 24 * 60 * 60 * 1000;
const STOPS: [number, number, number][] = [
  [0x4f, 0x8a, 0x3c],
  [0xe0, 0xb4, 0x00],
  [0xe0, 0x70, 0x1f],
  [0xc8, 0x32, 0x1f],
];

// The ring's colours in order, for the key under the rings.
export const RING_KEY = ["#4F8A3C", "#E0B400", "#E0701F", "#C8321F"];

// How far through its wait for the next review a range is: 0 just reviewed, 1 due.
export function reviewAge(srs: SRSState, now: Date): number {
  if (isDue(srs, now) || !srs.nextDueAt) return 1;
  const left = (new Date(srs.nextDueAt).getTime() - now.getTime()) / (BOX_INTERVAL_DAYS[srs.box] * DAY_MS);
  return Math.max(0, Math.min(1, 1 - left));
}

// Green just after a review, through yellow and orange, to red when it's due.
export function ringColor(age: number): string {
  const at = Math.min(age * 3, 2.999);
  const whole = Math.floor(at);
  const part = at - whole;
  return `#${STOPS[whole].map((value, i) => Math.round(value + (STOPS[whole + 1][i] - value) * part).toString(16).padStart(2, "0")).join("")}`;
}

export type RingKind = "next" | "today" | "learned" | "new";

export interface RingVerse {
  stop: TrailStop;
  verse: VerseSegment;
  entity?: MemorizedEntity;
  strength: VerseStrength;
  kind: RingKind;
  // How close to review, for a learned verse.
  age: number;
}

export interface RingPassage {
  section: TrailSection;
  verses: RingVerse[];
}

export interface RingChapter {
  chapter: number;
  book: string;
  passages: RingPassage[];
  known: number;
  total: number;
  hasToday: boolean;
  hasNext: boolean;
  // Its most urgent learned verse; unset until one is learned.
  age?: number;
}

export interface RingBook {
  chapters: RingChapter[];
  next: RingVerse | null;
  today: number;
  known: number;
  total: number;
}

// The Palace tab's boxes: every verse of the path by chapter and passage. Today's verses are the
// ones left in the next lesson day.
export function buildRingBook(passages: { section: TrailSection; lessons: TrailStop[] }[], entities: MemorizedEntity[], stumbles: Record<string, number[]>, now: Date): RingBook {
  const nextStop = passages.flatMap((passage) => passage.lessons).find((stop) => stop.state === "current");
  const chapters = new Map<number, RingChapter>();
  let next: RingVerse | null = null;
  let today = 0;
  for (const { section, lessons } of passages) {
    const first = lessons[0]?.verse;
    if (!first) continue;
    const home = chapters.get(first.chapter) ?? { chapter: first.chapter, book: first.book, passages: [], known: 0, total: 0, hasToday: false, hasNext: false };
    chapters.set(first.chapter, home);
    const verses = lessons.map((stop): RingVerse => {
      const verse = stop.verse!;
      const entity = entities.find((candidate) => candidate.book === verse.book && candidate.chapter === verse.chapter && candidate.startVerse <= verse.verseNumber && candidate.endVerse >= verse.verseNumber);
      const learned = stop.state === "done" || entity !== undefined;
      const isToday = !learned && nextStop !== undefined && stop.dayNumber === nextStop.dayNumber;
      const kind: RingKind = stop === nextStop ? "next" : isToday ? "today" : learned ? "learned" : "new";
      const ring: RingVerse = { stop, verse, entity, strength: verseStrength(verse, entity, learned, stumbles), kind, age: entity ? reviewAge(entity.srs, now) : 0 };
      if (kind === "next") next = ring;
      if (kind === "next" || kind === "today") {
        today++;
        home.hasToday = true;
      }
      if (kind === "next") home.hasNext = true;
      if (learned) {
        home.known++;
        home.age = Math.max(home.age ?? 0, ring.age);
      }
      home.total++;
      return ring;
    });
    home.passages.push({ section, verses });
  }
  const list = [...chapters.values()];
  return { chapters: list, next, today, known: list.reduce((sum, chapter) => sum + chapter.known, 0), total: list.reduce((sum, chapter) => sum + chapter.total, 0) };
}
