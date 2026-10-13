import { findBook } from "@/lib/bibleBooks";
import { getChapterVerses } from "@/lib/chapterContent";
import { getChapterVerseNumbers } from "@/lib/chapterVerseIndex";
import { BOOK_VERSE_COUNTS } from "@/lib/esvUsageLimits";

// Shared rules for the Path tab's Bible progress screens (design_handoff_bible_progress): tile
// shades, chapter lengths, the ring's percentage label.

export type ProgressFilter = "all" | "due" | "known";
export type TileLevel = "book" | "chapter";

// Green steps by the COUNT of verses known (so a little progress in a long book still shows):
// a fill mixing sage-800 into sage-100 at t%. Static class strings so Tailwind generates them.
const SHADES: Record<number, string> = {
  16: "bg-[color-mix(in_oklch,#3D472B_16%,#F0FAE1)] text-sage-900",
  22: "bg-[color-mix(in_oklch,#3D472B_22%,#F0FAE1)] text-sage-900",
  34: "bg-[color-mix(in_oklch,#3D472B_34%,#F0FAE1)] text-sage-900",
  45: "bg-[color-mix(in_oklch,#3D472B_45%,#F0FAE1)] text-sage-900",
  52: "bg-[color-mix(in_oklch,#3D472B_52%,#F0FAE1)] text-sage-900",
  68: "bg-[color-mix(in_oklch,#3D472B_68%,#F0FAE1)] text-white",
  72: "bg-[color-mix(in_oklch,#3D472B_72%,#F0FAE1)] text-white",
  85: "bg-[color-mix(in_oklch,#3D472B_85%,#F0FAE1)] text-white",
  90: "bg-[color-mix(in_oklch,#3D472B_90%,#F0FAE1)] text-white",
};
const STEPS: Record<TileLevel, [number, number][]> = {
  book: [[50, 90], [15, 72], [5, 52], [2, 34], [1, 16]],
  chapter: [[10, 85], [5, 68], [2, 45], [1, 22]],
};
export const NOT_STARTED_SHADE = "bg-sand-200 text-sand-600 dark:bg-zinc-800 dark:text-zinc-400";
export const COMPLETE_SHADE = "bg-sage-900 text-white";

export function tileShade(level: TileLevel, known: number, complete: boolean): string {
  if (complete) return COMPLETE_SHADE;
  const step = STEPS[level].find(([from]) => known >= from);
  return step ? SHADES[step[1]] : NOT_STARTED_SHADE;
}

// The key's five-shade ramp, lightest first.
export const KEY_SHADES: Record<TileLevel, string[]> = {
  book: [SHADES[16], SHADES[34], SHADES[52], SHADES[72], COMPLETE_SHADE],
  chapter: [SHADES[22], SHADES[45], SHADES[68], SHADES[85], COMPLETE_SHADE],
};

// A chapter's verse count: exact from its cached text or the remembered verse index, else an
// estimate (the book's verses shared evenly) — `exact` false means it can't be called complete.
export function chapterLength(book: string, chapter: number): { total: number; exact: boolean } {
  const cached = getChapterVerses(book, chapter)?.filter((verse) => verse.text.trim()).length;
  const known = cached || getChapterVerseNumbers(book, chapter)?.length;
  if (known) return { total: known, exact: true };
  const info = findBook(book);
  return { total: info ? Math.max(1, Math.round((BOOK_VERSE_COUNTS[book] ?? info.chapterCount * 25) / info.chapterCount)) : 25, exact: false };
}

export const bookLength = (book: string): number => BOOK_VERSE_COUNTS[book] ?? (findBook(book)?.chapterCount ?? 1) * 25;

// "34%", one decimal under 1% ("0.5%"), and "<0.1%" for a start too small to round.
export function percentLabel(known: number, total: number): string {
  const percent = total ? (known / total) * 100 : 0;
  if (percent > 0 && percent < 0.1) return "<0.1%";
  return percent > 0 && percent < 1 ? `${percent.toFixed(1)}%` : `${Math.round(percent)}%`;
}

// Whether a tile matches the filter — a filter fades the others, never hides them.
export const matchesFilter = (filter: ProgressFilter, known: number, due: number): boolean =>
  filter === "all" || (filter === "due" ? due > 0 : known > 0);
