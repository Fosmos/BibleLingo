import type { MindMapPericopeDatum } from "@/lib/mindMapTypes";
import { getChapterVerses } from "@/lib/chapterContent";

// The shape of one hall's stretch of path on the Mind Map — varied from hall to hall so every
// chapter gets a silhouette of its own you can recognise, yet FIXED: every "random" choice comes
// from a seed made of the hall's book, chapter and number, so the same hall is always the same
// shape (a place that changes can't be remembered).
// - each hall's path winds back and forth across the corridor — switching sides every few verses
//   (a seeded 3–5), starting to a seeded side, swinging a seeded width, leaning early or late (a
//   seeded skew), and roughened by a small seeded wobble at each verse — so it meanders like a
//   real trail rather than dropping straight down or tracing a formula;
// - the pocket opposite the path's first wide swing is left open for the hall's landmark (see
//   hallEmblemPoint);
// - each verse's circle is sized, and spaced from the one before, by how long the verse is, so
//   every stretch has its own rhythm underfoot.

export interface HallChip {
  x: number;
  y: number;
  size: number;
}

// First verse's distance below the hall card's center — clears a one-line card.
const CARD_CLEARANCE_PX = 44;
// Room after a hall's last verse before the next hall, with a gate between them (see
// MindMapLinks.tsx's thresholds).
export const HALL_EXIT_PADDING_PX = 44;
const MIN_CHIP_PX = 20;
const MAX_CHIP_PX = 40;
const MIN_STEP_PX = 44;
const MAX_STEP_PX = 66;
// How far the path swings to either side of the hall card — exported for the locked chapter
// view's width fit (lib/useMindMapPericopeZoomLock.ts).
export const MAX_SWEEP_PX = 90;
const MIN_SWEEP_PX = 50;
const WOBBLE_PX = 10;
// A verse whose text isn't cached yet counts as this long.
const DEFAULT_WORDS = 18;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

// A small seeded random-number generator (mulberry32) — the same seed always yields the same run.
export function seededRandom(seedText: string): () => number {
  let seed = 0;
  for (const char of seedText) seed = (Math.imul(seed, 31) + char.charCodeAt(0)) >>> 0;
  return () => {
    seed = (seed + 0x6d2b79f5) >>> 0;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Which way a hall's lobe bulges (1 right, -1 left) — seeded, with a lean toward alternating so
// runs of same-side halls stay short.
export function hallDirection(pericope: MindMapPericopeDatum, hallNumber: number | undefined): 1 | -1 {
  const alternate = (hallNumber ?? 1) % 2 === 1 ? 1 : -1;
  return seededRandom(`${pericope.book}|${pericope.chapter}|${hallNumber}|side`)() < 0.7 ? alternate : (-alternate as 1 | -1);
}

function verseWordCounts(pericope: MindMapPericopeDatum, verseNumbers: number[]): number[] {
  const verses = getChapterVerses(pericope.book, pericope.chapter);
  return verseNumbers.map((number) => {
    const text = verses?.[number - 1]?.text;
    return text ? text.split(/\s+/).filter(Boolean).length : DEFAULT_WORDS;
  });
}

// Each verse's circle, relative to its hall card's center, and the hall's total height (card
// center to the next hall's start). `extraCardHeightPx` is how much taller than one line the
// card is (a wrapped heading).
export function hallGeometry(
  pericope: MindMapPericopeDatum,
  verseNumbers: number[],
  hallNumber: number | undefined,
  extraCardHeightPx: number,
): { chips: HallChip[]; heightPx: number } {
  const count = verseNumbers.length;
  if (count === 0) return { chips: [], heightPx: 0 };
  const words = verseWordCounts(pericope, verseNumbers);
  const random = seededRandom(`${pericope.book}|${pericope.chapter}|${hallNumber}`);
  const direction = hallDirection(pericope, hallNumber);
  const sweep = Math.min(MAX_SWEEP_PX, Math.max(MIN_SWEEP_PX, (40 + 5 * count) * (0.75 + random() * 0.5)));
  // How many times the path crosses the corridor — about once every 3–5 verses (seeded).
  const swings = count <= 2 ? 1 : Math.max(1, Math.round(count / (3 + random() * 2)));
  // <1 leans the lobe's widest point late in the hall, >1 early.
  const skew = 0.6 + random() * 1.0;
  let y = CARD_CLEARANCE_PX + extraCardHeightPx / 2;
  const chips = words.map((wordCount, index) => {
    // 0 for a verse of ~5 words or fewer, 1 for ~40 or more.
    const weight = clamp01((wordCount - 5) / 35);
    if (index > 0) y += MIN_STEP_PX + (MAX_STEP_PX - MIN_STEP_PX) * weight;
    const t = Math.pow((index + 1) / (count + 1), skew);
    const x = direction * sweep * Math.sin(Math.PI * swings * t) + (random() * 2 - 1) * WOBBLE_PX;
    return { x, y, size: Math.round(MIN_CHIP_PX + (MAX_CHIP_PX - MIN_CHIP_PX) * weight) };
  });
  return { chips, heightPx: y + HALL_EXIT_PADDING_PX };
}

// Where a hall's landmark stands (see MindMapHallEmblem.tsx): in the middle of the corridor, at
// the height where the path swings widest — the open centre of the hall's winding stretch, with the
// path curving round it — relative to the hall card's center, like the chips. Undefined for a hall
// with no verses laid out yet.
//
// Sized with the hall: a long section's landmark is big, a short one's small — never wider than the
// gap between the corridor's centre and the path's swing (less a verse circle), so it never
// crowds the verses around it.
const EMBLEM_MARGIN_PX = 16;

export function hallEmblemPoint(chips: HallChip[]): { x: number; y: number; size: number } | undefined {
  if (chips.length === 0) return undefined;
  const widest = chips.reduce((best, chip) => (Math.abs(chip.x) > Math.abs(best.x) ? chip : best), chips[0]);
  // A clear margin on each side between the landmark and the path's verses.
  const room = 2 * (Math.abs(widest.x) - widest.size / 2 - EMBLEM_MARGIN_PX);
  const size = Math.round(Math.max(28, Math.min(96, room, 26 + chips.length * 6)));
  return { x: 0, y: widest.y, size };
}
