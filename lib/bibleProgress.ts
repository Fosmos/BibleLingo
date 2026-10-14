import { findBook } from "@/lib/bibleBooks";
import { getChapterVerses } from "@/lib/chapterContent";
import { getChapterVerseNumbers } from "@/lib/chapterVerseIndex";
import { BOOK_VERSE_COUNTS } from "@/lib/esvUsageLimits";

// Shared rules for the Path tab's Bible progress screens (design_handoff_bible_progress): tile
// shades, chapter lengths, the ring's percentage label.

export type ProgressFilter = "all" | "due" | "known";
export type TileLevel = "book" | "chapter";

// Green steps by the COUNT of verses known (so a little progress in a long book still shows):
// a fill mixing sage-800 into sage-100 at t%, kept light. A whole book or chapter takes the top
// step's shade, marked complete by its check badge (ProgressCircle.tsx) rather than a darker fill.
// Static class strings so Tailwind generates them.
const SHADES: Record<number, string> = {
  10: "bg-[color-mix(in_oklch,#3D472B_10%,#F0FAE1)] text-sage-900",
  12: "bg-[color-mix(in_oklch,#3D472B_12%,#F0FAE1)] text-sage-900",
  20: "bg-[color-mix(in_oklch,#3D472B_20%,#F0FAE1)] text-sage-900",
  24: "bg-[color-mix(in_oklch,#3D472B_24%,#F0FAE1)] text-sage-900",
  32: "bg-[color-mix(in_oklch,#3D472B_32%,#F0FAE1)] text-sage-900",
  36: "bg-[color-mix(in_oklch,#3D472B_36%,#F0FAE1)] text-sage-900",
  46: "bg-[color-mix(in_oklch,#3D472B_46%,#F0FAE1)] text-sage-900",
  48: "bg-[color-mix(in_oklch,#3D472B_48%,#F0FAE1)] text-sage-900",
};
const STEPS: Record<TileLevel, [number, number][]> = {
  book: [[15, 46], [5, 32], [2, 20], [1, 10]],
  chapter: [[10, 48], [5, 36], [2, 24], [1, 12]],
};
export const NOT_STARTED_SHADE = "bg-sand-200 text-sand-600 dark:bg-zinc-800 dark:text-zinc-400";

export function tileShade(level: TileLevel, known: number, complete: boolean): string {
  const step = complete ? STEPS[level][0] : STEPS[level].find(([from]) => known >= from);
  return step ? SHADES[step[1]] : NOT_STARTED_SHADE;
}

// The key's five swatches, lightest first — the last (whole book / chapter) is the top step.
export const KEY_SHADES: Record<TileLevel, string[]> = {
  book: [SHADES[10], SHADES[20], SHADES[32], SHADES[46], SHADES[46]],
  chapter: [SHADES[12], SHADES[24], SHADES[36], SHADES[48], SHADES[48]],
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
