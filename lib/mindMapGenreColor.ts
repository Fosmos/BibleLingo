import { findBook } from "@/lib/bibleBooks";
import { bookGenre, type GenreId } from "@/lib/canonTree";
import type { MindMapDatum } from "@/lib/mindMapHierarchy";
import { bookColor, chapterColor, genreColor, hslToHex, lighten } from "@/lib/mindMapPlaceColor";

type Hsl = [number, number, number];

// Every id in this tree is built as "kind:bookName[:...]" (see lib/mindMapHierarchy.ts) except
// genre/subgenre's own "kind:testament:genreId[:subgenreId]" shape — this pulls the book-name
// segment out of the former, the one every OTHER kind's id starts with after its own `kind:`.
function bookNameFromId(id: string): string {
  return id.split(":")[1] ?? "";
}

// Which of the 7 literary-genre categories (see lib/canonTree.ts's GenreId) a node's own branch
// belongs to — undefined only for root/testament, which sit ABOVE the category split and so have
// no single genre of their own. Purely derived from the node's own id/fields already in hand —
// not a separately stored field on every datum kind, so it can never drift from what the tree
// itself actually says.
export function genreIdForNode(datum: MindMapDatum): GenreId | undefined {
  switch (datum.kind) {
    case "genre":
    case "subgenre":
      return datum.id.split(":")[2] as GenreId;
    case "book": {
      const book = findBook(datum.name);
      return book ? bookGenre(book) : undefined;
    }
    case "theme":
    case "chapter": {
      const book = findBook(bookNameFromId(datum.id));
      return book ? bookGenre(book) : undefined;
    }
    case "pericope": {
      const book = findBook(datum.book);
      return book ? bookGenre(book) : undefined;
    }
    default:
      return undefined;
  }
}

export interface MindMapNodeColor {
  bg: string;
  text: string;
}

const DARK_TEXT = "#2C2724";
const WHITE_TEXT = "#FFFFFF";

// The "artisanal, muted" palette — every value below is a specific hex, not a Tailwind named
// color, so nodes render them via a CSS custom property + a `bg-[var(--x)]` arbitrary-value
// class (see mindMapNodeColorVars below) rather than a Tailwind utility.
export const ROOT_COLOR: MindMapNodeColor = { bg: "#4A3B32", text: WHITE_TEXT };
export const TOGGLE_BADGE_CLASS = "bg-[#8B6B57] border-white";
// Same warm bronze TOGGLE_BADGE_CLASS already wears, split out as its own class for surfaces
// that need just the fill (no border) — a pericope gateway's own brass plaque strip
// (MindMapPericopeGateway.tsx), rather than a corner badge.
export const BRASS_PLAQUE_CLASS = "bg-[#8B6B57]";
export const CANVAS_BG_CLASS = "!bg-[#e8e6e1] dark:!bg-zinc-950";
export const LINK_STROKE_CLASS = "stroke-[#bcaaa4] dark:stroke-brand-700";
// Same brass tone as TOGGLE_BADGE_CLASS/BRASS_PLAQUE_CLASS, as a stroke — a chapter spine
// segment (MindMapLinks.tsx) once the verse/pericope it leads FROM is actually memorized, tying
// the "filled in" line to the same "Room Gateway" plaque color rather than inventing a new hue.
export const SPINE_SOLID_BROWN_CLASS = "stroke-[#8B6B57] dark:stroke-[#a3856c]";

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// Perceptual-ish luminance (plain, not gamma-corrected — good enough for a light/dark text pick,
// not for color-accurate reproduction) — decides whether a given fill needs dark or white text.
function textForBackground(rgb: [number, number, number]): string {
  const luminance = 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
  return luminance > 150 ? DARK_TEXT : WHITE_TEXT;
}

// Testament sits ABOVE the genre split (it spans several genres at once), so it has no single
// place colour of its own — this shared neutral, also the fallback for anything unresolvable.
const NEUTRAL: MindMapNodeColor = { bg: "#B0BEC5", text: DARK_TEXT };


function fromHsl(hsl: Hsl | undefined): MindMapNodeColor {
  if (!hsl) return NEUTRAL;
  const bg = hslToHex(hsl);
  return { bg, text: textForBackground(hexToRgb(bg)) };
}

// The place colour of a node's own location (see lib/mindMapPlaceColor.ts): genre hue, book
// variant, chapter shade, hall step. Fixed for good — never changed by progress, focus or what's
// due (those are small marks, not fills).
export function mindMapPlaceHsl(datum: MindMapDatum): Hsl | undefined {
  switch (datum.kind) {
    case "genre":
    case "subgenre":
      return genreColor(datum.id.split(":")[2] as GenreId);
    case "book":
      return bookColor(datum.name);
    case "theme":
      return bookColor(bookNameFromId(datum.id));
    case "chapter":
      return chapterColor(datum.book, datum.chapter);
    case "pericope":
      return chapterColor(datum.book, datum.chapter);
    default:
      return undefined;
  }
}

export function mindMapNodeColor(datum: MindMapDatum): MindMapNodeColor {
  if (datum.kind === "root") return ROOT_COLOR;
  return fromHsl(mindMapPlaceHsl(datum));
}

// A hall's verse chips — a lighter cut of the hall's own colour.
export function verseChipColor(pericope: MindMapDatum): MindMapNodeColor {
  const hsl = mindMapPlaceHsl(pericope);
  return fromHsl(hsl ? lighten(hsl, 9) : undefined);
}

// A hall's stretch of path — a deeper cut of the hall's colour, so the corridor changes colour
// from one hall to the next.
export function hallPathStroke(pericope: MindMapDatum): string {
  const hsl = mindMapPlaceHsl(pericope);
  return hsl ? hslToHex(lighten([hsl[0], hsl[1] + 8, hsl[2]], -18)) : "#8B6B57";
}

// The CSS custom properties a node's own `style` sets so its className can reference them via
// `bg-[var(--nodeBg)]`/`text-[var(--nodeText)]` — the sanctioned "dynamic value via CSS variable"
// pattern for colors that aren't one of a small fixed set of Tailwind utility classes.
export function mindMapNodeColorVars(color: MindMapNodeColor): Record<string, string> {
  return { "--nodeBg": color.bg, "--nodeText": color.text };
}

// The place colour of the chapter a verse sits in (its halls share it) — the Mind Map lesson
// sheet's top edge while that verse is on it (see LessonBottomSheet.tsx), tying the text being
// recited to its place on the map.
export function verseHallAccent(book: string, chapter: number): string | undefined {
  const hsl = chapterColor(book, chapter);
  return hsl ? hslToHex(hsl) : undefined;
}
