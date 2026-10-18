import { findBook } from "@/lib/bibleBooks";
import { bookGenre, type GenreId } from "@/lib/canonTree";
import type { MindMapDatum } from "@/lib/mindMapHierarchy";
import { bookPlace, chapterPlace, genrePlace, rampHex, type Place } from "@/lib/mindMapPlaceColor";

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
  // A step deeper than `bg` — a verse chip's ring (see verseChipColor).
  border?: string;
}

// The Organic restyle's map chrome. Every value is a specific hex, rendered through a CSS custom
// property + a `bg-[var(--x)]` arbitrary-value class (see mindMapNodeColorVars below).
export const ROOT_COLOR: MindMapNodeColor = { bg: "#2E2B25", text: "#F9F4ED" };
// Door badges, hall plaques and gates: terracotta 700, with a ground-coloured rim.
export const TOGGLE_BADGE_CLASS = "bg-[#8C491A] border-[#FAF9F6] dark:border-zinc-950";
export const BRASS_PLAQUE_CLASS = "bg-[#8C491A]";
export const CANVAS_BG_CLASS = "!bg-[#FAF9F6] dark:!bg-zinc-950";
export const LINK_STROKE_CLASS = "stroke-[#C0B6A5] dark:stroke-brand-700";
export const SPINE_SOLID_BROWN_CLASS = "stroke-[#8C491A] dark:stroke-[#a3856c]";

// Testament sits ABOVE the genre split (it spans several genres at once), so it has no single
// place of its own — neutral 300, also the fallback for anything unresolvable.
const NEUTRAL: MindMapNodeColor = { bg: rampHex("neutral", 300), text: rampHex("neutral", 900) };

// Text on a place fill: its ramp's 900 — except on the deep sage fills (500 and up), which take
// the neutral 100 the design pairs with them.
function fromPlace(place: Place | undefined): MindMapNodeColor {
  if (!place) return NEUTRAL;
  const lightText = place.ramp === "sage" ? place.step >= 500 : place.step >= 600;
  return { bg: rampHex(place.ramp, place.step), text: lightText ? rampHex("neutral", 100) : rampHex(place.ramp, 900) };
}

// The place of a node's own location (see lib/mindMapPlaceColor.ts): genre ramp, book step,
// chapter shade, hall step. Fixed for good — never changed by progress, focus or what's due
// (those are small marks, not fills).
export function mindMapPlace(datum: MindMapDatum): Place | undefined {
  switch (datum.kind) {
    case "genre":
      return genrePlace(datum.id.split(":")[2] as GenreId);
    case "subgenre":
      return genrePlace(datum.id.split(":")[2] as GenreId, true);
    case "book":
      return bookPlace(datum.name);
    case "theme":
      return bookPlace(bookNameFromId(datum.id));
    case "chapter":
      return chapterPlace(datum.book, datum.chapter);
    case "pericope":
      return chapterPlace(datum.book, datum.chapter);
    default:
      return undefined;
  }
}

export function mindMapNodeColor(datum: MindMapDatum): MindMapNodeColor {
  if (datum.kind === "root") return ROOT_COLOR;
  return fromPlace(mindMapPlace(datum));
}

// A hall's verse chips — one step lighter than the hall (never under 100), ringed a step deeper
// than the chip itself.
export function verseChipColor(pericope: MindMapDatum): MindMapNodeColor {
  const place = mindMapPlace(pericope);
  if (!place) return NEUTRAL;
  const chip = { ramp: place.ramp, step: Math.max(100, place.step - 100) };
  return { ...fromPlace(chip), border: rampHex(chip.ramp, chip.step + 100) };
}

// A hall's stretch of path — its ramp's 700 once walked (the dashed, unwalked stretch is drawn
// at 500 — see hallPathTrailStroke), so the corridor carries its genre's colour.
export function hallPathStroke(pericope: MindMapDatum): string {
  const place = mindMapPlace(pericope);
  return place ? rampHex(place.ramp, 700) : "#8C491A";
}

export function hallPathTrailStroke(pericope: MindMapDatum): string {
  const place = mindMapPlace(pericope);
  return place ? rampHex(place.ramp, 500) : "#C0B6A5";
}

// A hall's emblem — its ramp's 400 (drawn at 55% opacity).
export function hallEmblemColor(pericope: MindMapDatum): string {
  const place = mindMapPlace(pericope);
  return place ? rampHex(place.ramp, 400) : "#C0B6A5";
}

// The CSS custom properties a node's own `style` sets so its className can reference them via
// `bg-[var(--nodeBg)]`/`text-[var(--nodeText)]`/`border-[var(--nodeBorder)]` — the sanctioned
// "dynamic value via CSS variable" pattern for colors that aren't a fixed Tailwind utility.
export function mindMapNodeColorVars(color: MindMapNodeColor): Record<string, string> {
  return { "--nodeBg": color.bg, "--nodeText": color.text, "--nodeBorder": color.border ?? color.bg };
}

// The place colour of the chapter a verse sits in (its halls share it).
export function verseHallAccent(book: string, chapter: number): string | undefined {
  const place = chapterPlace(book, chapter);
  return place ? rampHex(place.ramp, place.step) : undefined;
}
