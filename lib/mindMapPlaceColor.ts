import { BIBLE_BOOKS, findBook } from "@/lib/bibleBooks";
import { bookGenre, type GenreId } from "@/lib/canonTree";

// Colour as PLACE on the Mind Map — a memory palace's colours say where you are, never how you're
// doing (progress, due reviews and today's lesson are small marks: rings, checks, pins). Three
// nested layers, each fixed for good so a place always looks the same:
// - the GENRE sets the hue (all Pauline letters terracotta, all Gospels blue) — the territory;
// - each BOOK is its own variant of that hue (a little warmer or cooler, lighter or deeper), with
//   neighbouring books alternating light and dark so no two side by side look alike;
// - each CHAPTER shades its book's variant from light (chapter 1) to deep (the last), and its
//   HALLS all share that chapter colour.

type Hsl = [number, number, number];

function hexToHsl(hex: string): Hsl {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
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

// One base hue per literary genre — the muted, warm-earthy family the map has always used.
export const GENRE_BASE_HEX: Record<GenreId, string> = {
  law: "#A8AE8C",
  history: "#E6BC98",
  wisdom: "#B08A9E",
  prophets: "#7C8CA0",
  gospels: "#A9C1C4",
  epistles: "#C88276",
  prophecy: "#6B4C5A",
};

const clampL = (l: number) => Math.min(86, Math.max(26, l));

// Hue nudges cycled through a genre's books (degrees) — small enough the books still read as one
// family, big enough that two books side by side are told apart.
const BOOK_HUE_STEPS = [0, -9, 7, -4, 11, -12, 4];
// Saturation nudges cycled alongside — a muted base (the greyish Gospel blue, say) barely shows a
// hue shift on its own, so each book also gets a little more or less colour.
const BOOK_SATURATION_STEPS = [0, 14, -4, 22, 8, -2, 16];
// A genre with only a few books (the four Gospels) spreads them further apart, so each is clearly
// its own shade.
const SMALL_GENRE_BOOKS = 5;
const SMALL_GENRE_SPREAD = 2.4;

export function genreColor(genre: GenreId): Hsl {
  return hexToHsl(GENRE_BASE_HEX[genre]);
}

export function bookColor(bookName: string): Hsl | undefined {
  const book = findBook(bookName);
  if (!book) return undefined;
  const genre = bookGenre(book);
  const genreBooks = BIBLE_BOOKS.filter((candidate) => bookGenre(candidate) === genre);
  const index = genreBooks.findIndex((candidate) => candidate.name === bookName);
  const spread = genreBooks.length <= SMALL_GENRE_BOOKS ? SMALL_GENRE_SPREAD : 1;
  const [h, s, l] = genreColor(genre);
  return [
    h + BOOK_HUE_STEPS[index % BOOK_HUE_STEPS.length] * spread,
    s + BOOK_SATURATION_STEPS[index % BOOK_SATURATION_STEPS.length] * (spread > 1 ? 1.4 : 1),
    clampL(l + (index % 2 === 0 ? -6 : 7) + ((index % 3) - 1) * 2),
  ];
}

export function chapterColor(bookName: string, chapter: number): Hsl | undefined {
  const base = bookColor(bookName);
  const count = findBook(bookName)?.chapterCount ?? 1;
  if (!base) return undefined;
  const t = count > 1 ? (chapter - 1) / (count - 1) : 0.5;
  return [base[0], base[1], clampL(base[2] + 10 - 20 * t)];
}

// Lighter/deeper cuts of a place colour — a hall's verse chips, and its stretch of path.
export function lighten([h, s, l]: Hsl, amount: number): Hsl {
  return [h, s, clampL(l + amount)];
}
