// Parchment verse text is a FIXED size everywhere — the reading view, Learn, SRS review —
// rather than an auto-shrink-to-fit. Pagination (lib/chapterPagination.ts) packs every page to
// this same size and, now that a verse is free to split across the page break when it has to,
// fills each page close to the bottom on its own — there's no need to shrink the font to make
// pages fill, the way there was back when a page could only ever hold WHOLE verses.
export const FIXED_PARCHMENT_FONT_PX = 18;

// The AVERAGE effective per-line height lib/chapterPagination.ts's/lib/pageBudget.ts's own
// line-budget math assumes, as a multiple of the font size — an approximation now, not an
// exact mirror of the CSS the way this used to be a single shared number. A clause block's own
// real rendered height is actually two different values (see SenseLineVerse.tsx's own
// SenseLineRow): a tight leading-[1.5] on every line, PLUS a one-time mt-[0.9em] on each
// distinct clause (not on a continuation row, and not per LINE within a clause that happens to
// wrap on its own) — a per-clause cost the pagination math below has no per-clause bookkeeping
// for, only a per-LINE one. This constant is picked to land close to that blended real average
// rather than either tier exactly; ParchmentCard.tsx's own auto-sized (not `fill`) height is
// what actually keeps a page that drifts from this estimate safe either direction — it just
// renders as tall as it genuinely needs to, it never clips or overflows a fixed box.
export const PARCHMENT_LINE_HEIGHT_MULTIPLIER = 2.3;
