// Parchment verse text is a FIXED size everywhere — the reading view, Learn, SRS review —
// rather than an auto-shrink-to-fit. Pagination (lib/chapterPagination.ts) packs every page to
// this same size and, now that a verse is free to split across the page break when it has to,
// fills each page close to the bottom on its own — there's no need to shrink the font to make
// pages fill, the way there was back when a page could only ever hold WHOLE verses.
export const FIXED_PARCHMENT_FONT_PX = 16;
