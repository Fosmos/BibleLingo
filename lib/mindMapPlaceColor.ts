import { BIBLE_BOOKS, findBook } from "@/lib/bibleBooks";
import { bookGenre, type GenreId } from "@/lib/canonTree";

// Colour as PLACE on the Mind Map — a memory palace's colours say where you are, never how you're
// doing (progress, due reviews and today's lesson are small marks: rings, checks, pins). All of
// it comes from the Organic restyle's three ramps (terracotta accent, sage, warm neutral), nested
// so a place always looks the same:
// - the GENRE picks the ramp (Gospels sage, Paul's letters terracotta, the Prophets neutral…) and
//   its own circle sits at step 500, a subgenre at 400;
// - each BOOK takes its own step around 300, neighbouring books alternating lighter and darker so
//   no two side by side look alike;
// - each CHAPTER shades from light (chapter 1) to deeper (the last), odd and even chapters a half
//   step apart, and its HALLS all share that chapter colour.

type Hsl = [number, number, number];
export type RampName = "accent" | "sage" | "neutral";

// Organic ramps, steps 100–900 (tailwind.config.ts's brand / sage / sand).
const RAMP_HEX: Record<RampName, Record<number, string>> = {
  accent: { 100: "#FFF2EB", 200: "#FFE1D0", 300: "#FFC6A5", 400: "#F6A06B", 500: "#D67F48", 600: "#B2622D", 700: "#8C491A", 800: "#643312", 900: "#402310" },
  sage: { 100: "#F0FAE1", 200: "#E1EECC", 300: "#CCDBB2", 400: "#AEBF92", 500: "#8FA073", 600: "#728157", 700: "#56633F", 800: "#3D472B", 900: "#272E1B" },
  neutral: { 100: "#F9F4ED", 200: "#EEE7DB", 300: "#DCD3C4", 400: "#C0B6A5", 500: "#A19786", 600: "#82796A", 700: "#645C50", 800: "#474238", 900: "#2E2B25" },
};

// Which ramp each literary genre lives in.
export const GENRE_RAMP: Record<GenreId, RampName> = {
  law: "sage",
  history: "neutral",
  wisdom: "accent",
  prophets: "neutral",
  gospels: "sage",
  epistles: "accent",
  prophecy: "sage",
};

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function hexToHsl(hex: string): Hsl {
  const [r, g, b] = hexToRgb(hex).map((c) => c / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l * 100];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s * 100, l * 100];
}

export function hslToHex([h, s, l]: Hsl): string {
  const sat = Math.min(100, Math.max(0, s)) / 100;
  const light = Math.min(100, Math.max(0, l)) / 100;
  const k = (n: number) => (n + ((h % 360) + 360) / 30) % 12;
  const a = sat * Math.min(light, 1 - light);
  const f = (n: number) => light - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  return `#${[f(0), f(8), f(4)].map((x) => Math.round(x * 255).toString(16).padStart(2, "0")).join("")}`;
}

// A ramp colour at any step from 100 to 900, blending the two stops around a fractional step
// (e.g. 250) — still the ramp's own colour family, just finer-grained for chapter shading.
export function rampHex(ramp: RampName, step: number): string {
  const clamped = Math.min(900, Math.max(100, step));
  const lower = Math.floor(clamped / 100) * 100;
  const upper = Math.min(900, lower + 100);
  const t = (clamped - lower) / 100;
  const a = hexToRgb(RAMP_HEX[ramp][lower]);
  const b = hexToRgb(RAMP_HEX[ramp][upper]);
  return `#${a.map((c, i) => Math.round(c + (b[i] - c) * t).toString(16).padStart(2, "0")).join("")}`;
}

// A place: its ramp and step. Callers turn it into fills, text and borders.
export interface Place {
  ramp: RampName;
  step: number;
}

export const toHsl = (place: Place): Hsl => hexToHsl(rampHex(place.ramp, place.step));

// Steps cycled through a genre's books — around 300, neighbours one lighter and one deeper.
const BOOK_STEPS = [300, 220, 380];

function genreOfBook(bookName: string): GenreId | undefined {
  const book = findBook(bookName);
  return book ? bookGenre(book) : undefined;
}

export function genrePlace(genre: GenreId, subgenre = false): Place {
  return { ramp: GENRE_RAMP[genre], step: subgenre ? 400 : 500 };
}

export function bookPlace(bookName: string): Place | undefined {
  const genre = genreOfBook(bookName);
  if (!genre) return undefined;
  const index = BIBLE_BOOKS.filter((candidate) => bookGenre(candidate) === genre).findIndex((candidate) => candidate.name === bookName);
  return { ramp: GENRE_RAMP[genre], step: BOOK_STEPS[Math.max(0, index) % BOOK_STEPS.length] };
}

// Chapter 1 sits at step 170, the last chapter at 300, and every even chapter half a step deeper.
export function chapterPlace(bookName: string, chapter: number): Place | undefined {
  const genre = genreOfBook(bookName);
  if (!genre) return undefined;
  const count = findBook(bookName)?.chapterCount ?? 1;
  const t = count > 1 ? (chapter - 1) / (count - 1) : 0;
  return { ramp: GENRE_RAMP[genre], step: 170 + 130 * t + (chapter % 2 === 0 ? 50 : 0) };
}

// The genre territory wash behind a whole genre's branch (MindMapTerritories.tsx).
export function territoryFill(genre: GenreId): string {
  return rampHex(GENRE_RAMP[genre], 200);
}
