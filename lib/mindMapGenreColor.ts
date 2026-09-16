import { findBook } from "@/lib/bibleBooks";
import { bookGenre, type GenreId } from "@/lib/canonTree";
import type { MindMapDatum } from "@/lib/mindMapHierarchy";

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
export const CANVAS_BG_CLASS = "!bg-[#e8e6e1] dark:!bg-zinc-950";
export const LINK_STROKE_CLASS = "stroke-[#bcaaa4] dark:stroke-brand-700";

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function toHex(rgb: [number, number, number]): string {
  return `#${rgb.map((channel) => Math.round(channel).toString(16).padStart(2, "0")).join("")}`;
}

// Perceptual-ish luminance (plain, not gamma-corrected — good enough for a light/dark text pick,
// not for color-accurate reproduction) — decides whether a given fill needs dark or white text.
function textForBackground(rgb: [number, number, number]): string {
  const luminance = 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
  return luminance > 150 ? DARK_TEXT : WHITE_TEXT;
}

// How much darker the ACTIVE version of a node's own group color reads, relative to its plain
// inactive tone — every group (testament's own neutral, each genre's own accent) has exactly
// ONE base hue; "on today's real active-lesson chain" is that SAME hue, just darkened, never a
// different color substituted in. 0.72 keeps an already-dark accent (Prophecy) from crushing
// into near-black while still reading clearly richer/darker than its own plain tone.
const ACTIVE_DARKEN_FACTOR = 0.72;

function darken(hex: string): MindMapNodeColor {
  const rgb = hexToRgb(hex).map((channel) => channel * ACTIVE_DARKEN_FACTOR) as [number, number, number];
  return { bg: toHex(rgb), text: textForBackground(rgb) };
}

// Testament sits ABOVE the genre split (it spans several genres at once), so it has no single
// category accent to inherit — its own "group color" is this shared neutral instead, same as
// the last-resort fallback for any node genreIdForNode can't resolve a genre for at all
// (shouldn't normally happen).
const NEUTRAL: MindMapNodeColor = { bg: "#B0BEC5", text: DARK_TEXT };
const ACTIVE_NEUTRAL = darken(NEUTRAL.bg);

// One base accent per literary-genre category (see lib/canonTree.ts's GENRE_LABELS) — every
// node in that category's own branch, at every depth from Genre down through Pericope, reads in
// THIS one hue: the plain accent while inactive, a DARKER shade of that SAME accent (see
// GENRE_ACTIVE_ACCENTS below) while on today's real active-lesson chain — never a different,
// unrelated color. History/Epistles/Prophecy are the design's own explicit values; Law/Wisdom/
// (OT) Prophets/Gospels extrapolate the same muted, warm-earthy family for the categories the
// design didn't spell out.
const GENRE_INACTIVE_ACCENTS: Record<GenreId, MindMapNodeColor> = {
  law: { bg: "#A8AE8C", text: DARK_TEXT },
  history: { bg: "#E6BC98", text: DARK_TEXT },
  wisdom: { bg: "#B08A9E", text: DARK_TEXT },
  prophets: { bg: "#7C8CA0", text: WHITE_TEXT },
  gospels: { bg: "#A9C1C4", text: DARK_TEXT },
  epistles: { bg: "#C88276", text: DARK_TEXT },
  prophecy: { bg: "#6B4C5A", text: WHITE_TEXT },
};

const GENRE_ACTIVE_ACCENTS: Record<GenreId, MindMapNodeColor> = {
  law: darken(GENRE_INACTIVE_ACCENTS.law.bg),
  history: darken(GENRE_INACTIVE_ACCENTS.history.bg),
  wisdom: darken(GENRE_INACTIVE_ACCENTS.wisdom.bg),
  prophets: darken(GENRE_INACTIVE_ACCENTS.prophets.bg),
  gospels: darken(GENRE_INACTIVE_ACCENTS.gospels.bg),
  epistles: darken(GENRE_INACTIVE_ACCENTS.epistles.bg),
  prophecy: darken(GENRE_INACTIVE_ACCENTS.prophecy.bg),
};

// An inactive node's own genre accent — the SAME one its own genre circle uses, so a whole
// inactive branch (Law's books, Law's chapters, Law's pericopes, all the way down) reads as one
// consistent hue, not just the genre circle at the top of it. Falls back to the shared neutral
// only when a genre can't be resolved at all (testament, or a malformed book lookup).
function inactiveColorFor(datum: MindMapDatum): MindMapNodeColor {
  const genreId = genreIdForNode(datum);
  return genreId ? GENRE_INACTIVE_ACCENTS[genreId] : NEUTRAL;
}

function activeColorFor(datum: MindMapDatum): MindMapNodeColor {
  const genreId = genreIdForNode(datum);
  return genreId ? GENRE_ACTIVE_ACCENTS[genreId] : ACTIVE_NEUTRAL;
}

// The active book's OWN direct CHAPTER children (never theme nodes — see useMindMapGradientRow.ts)
// fade left to right from that SAME darkened active-group color down to a pale, soft slate. Text
// contrast flips automatically partway through (see textForBackground) once the tint lightens.
const GRADIENT_END_RGB: [number, number, number] = [0xe2, 0xe8, 0xf0]; // slate-200

function mixChannel(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

function gradientColor(t: number, startRgb: [number, number, number]): MindMapNodeColor {
  const rgb: [number, number, number] = [
    mixChannel(startRgb[0], GRADIENT_END_RGB[0], t),
    mixChannel(startRgb[1], GRADIENT_END_RGB[1], t),
    mixChannel(startRgb[2], GRADIENT_END_RGB[2], t),
  ];
  return { bg: toHex(rgb), text: textForBackground(rgb) };
}

// One node's own resolved color. `active` is the caller's already-computed "is this on today's
// real active-lesson chain" boolean (see MindMapNodeCard.tsx — the same signal every kind
// already derives, just no longer picking a completed/locked SHADE, only active-vs-not: this
// palette has no separate "graduated" tone). `gradientT` (0..1, left to right) overrides
// everything else for a node in the active book's own direct-children row — see
// useMindMapGradientRow.ts — fading from that SAME node's own active-group color rather than a
// fixed constant, so it still matches whichever genre the active book actually belongs to.
export function mindMapNodeColor(datum: MindMapDatum, active: boolean, gradientT?: number): MindMapNodeColor {
  if (datum.kind === "root") return ROOT_COLOR;
  if (gradientT !== undefined) return gradientColor(gradientT, hexToRgb(activeColorFor(datum).bg));
  return active ? activeColorFor(datum) : inactiveColorFor(datum);
}

// The CSS custom properties a node's own `style` sets so its className can reference them via
// `bg-[var(--nodeBg)]`/`text-[var(--nodeText)]` — the sanctioned "dynamic value via CSS variable"
// pattern for colors that aren't one of a small fixed set of Tailwind utility classes.
export function mindMapNodeColorVars(color: MindMapNodeColor): Record<string, string> {
  return { "--nodeBg": color.bg, "--nodeText": color.text };
}
