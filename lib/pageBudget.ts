import { FIXED_PARCHMENT_FONT_PX } from "@/lib/parchmentFontRange";

// How many lines of verse text actually fit on one parchment page, and how wide each of those
// lines is to lay out against — real geometry throughout, no density heuristic. The OLD model
// estimated a "words per page" budget from a words-per-line-per-px ratio calibrated (by hand,
// against one viewport and one chapter) at a DIFFERENT baseline font size and scaled up — that
// estimate silently drifted wrong on any viewport/chapter it wasn't tuned against (severely
// underfilling wide/tall screens in particular, since the calibrated ratio undercounted how
// many words a real line that wide actually holds). Lines, by contrast, are just arithmetic —
// `leading-loose` is a real, exact 2× line-height — and lib/textMeasurement.ts now measures
// each WORD's actual rendered width (canvas `measureText` against this app's own real font),
// so pagination (lib/chapterPagination.ts) can word-wrap for real instead of guessing.
const OUTER_WRAPPER_PADDING_PX = 32; // ChapterReadingView.tsx's `px-4`, both sides
const MAX_OUTER_WIDTH_PX = 672; // Tailwind's `max-w-2xl` cap on that wrapper
const NARROW_BREAKPOINT_PX = 640; // Tailwind's `sm` — where ParchmentCard's own padding grows
const NARROW_INNER_PADDING_PX = 48; // ParchmentCard.tsx's `px-6`, both sides
const WIDE_INNER_PADDING_PX = 96; // ParchmentCard.tsx's `sm:px-12`, both sides
// ParchmentCard.tsx's own vertical padding (`pt-5 pb-8` / `sm:pt-6 sm:pb-10`) — eats into the
// SAME fillHeightPx the card's outer box is given (see useParchmentFillHeight.ts, which
// measures the outer box, not the padded content area), so it has to come back out here before
// what's left gets divided into lines. Missing this entirely was the other half of the old
// model's drift — it let pagination assume a couple of lines' worth of space that was actually
// padding, nudging every page's budget in the opposite direction from the words-per-line
// undercount above.
const NARROW_VERTICAL_PADDING_PX = 20 + 32; // pt-5 + pb-8
const WIDE_VERTICAL_PADDING_PX = 24 + 40; // sm:pt-6 + sm:pb-10

function textColumnWidthPx(viewportWidthPx: number): number {
  const outerWidth = Math.min(viewportWidthPx, MAX_OUTER_WIDTH_PX) - OUTER_WRAPPER_PADDING_PX;
  const innerPadding = viewportWidthPx >= NARROW_BREAKPOINT_PX ? WIDE_INNER_PADDING_PX : NARROW_INNER_PADDING_PX;
  return Math.max(outerWidth - innerPadding, 0);
}

function cardVerticalPaddingPx(viewportWidthPx: number): number {
  return viewportWidthPx >= NARROW_BREAKPOINT_PX ? WIDE_VERTICAL_PADDING_PX : NARROW_VERTICAL_PADDING_PX;
}

// Pre-mount fallbacks only — real `viewportWidthPx`/`availableHeightPx` land within one effect
// pass and replace these; kept modest rather than 0 purely so the very first, throwaway render
// doesn't fragment a whole chapter into one-word pages before that correction lands.
const MIN_COLUMN_WIDTH_PX = 200;
const MIN_LINES_PER_PAGE = 3;

export interface PageBudget {
  // How many lines of verse text fit in the available height, at the fixed font size.
  linesPerPage: number;
  // How wide each of those lines is to word-wrap against.
  columnWidthPx: number;
}

// `fontSizePx` defaults to the one fixed size every parchment renders at (see
// lib/parchmentFontRange.ts) — every real caller packs for exactly the size it's about to show.
export function resolvePageBudget(viewportWidthPx: number, availableHeightPx: number, fontSizePx: number = FIXED_PARCHMENT_FONT_PX): PageBudget {
  const lineHeightPx = fontSizePx * 2; // Tailwind's `leading-loose`
  const columnWidthPx = Math.max(textColumnWidthPx(viewportWidthPx), MIN_COLUMN_WIDTH_PX);
  const textAreaHeightPx = Math.max(availableHeightPx - cardVerticalPaddingPx(viewportWidthPx), 0);
  const linesPerPage = Math.max(MIN_LINES_PER_PAGE, Math.floor(textAreaHeightPx / lineHeightPx));
  return { linesPerPage, columnWidthPx };
}
