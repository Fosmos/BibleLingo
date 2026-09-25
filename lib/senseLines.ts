// Deterministic sense-line parsing for Bible verse text — breaks a passage into syntactically
// balanced lines (one clause/phrase per line, the way a printed sense-line Bible does). Two
// passes, in order, PUNCTUATION ONLY — nothing else, no line-length fallback of any kind (see
// lib/senseLineSplitting.ts for the actual implementation, split out purely to keep this file
// under this codebase's own 200-line cap):
//
// Pass 1 (sentence ends): split at a real SENTENCE end — . ? ! only — since a full stop is a
// genuine sentence boundary regardless of how short either side is. The mark (and any closing
// quote right after it) stays attached to the word before it.
//
// Pass 2 (every minor pause): EVERY comma, semicolon, colon, or em-dash within a Pass-1 sentence
// becomes its own line, matching the classic "sense-line Bible" convention of one clause per
// line. A clause with no punctuation of its own inside it (rare) stays whole, however long — the
// browser's own real wrap (see SenseLineRow.tsx's own hanging indent) handles it if it ever
// genuinely doesn't fit; this file no longer measures or cares about line length at all.

import { splitIntoLines } from "@/lib/senseLineSplitting";

// See this file's own top-of-file doc comment.
export function parseToSenseLines(text: string): string[] {
  return splitIntoLines(text);
}

// Shared with ChapterPageContent.tsx's own rendering so pagination's line-budget math and the
// real on-screen layout can never drift apart — a page is packed to fit exactly the clause
// blocks that will actually render at this same width. Every line renders flush at the SAME
// left margin as the verse's own first line, regardless of which punctuation mark split it off
// — only a genuine mid-clause line WRAP (a browser-wrapped second line of the same clause) hangs
// indented under that clause's own first word (see HANGING_INDENT_PX/SenseLineRow.tsx).
export const HANGING_INDENT_PX = 24; // 1.5rem — the wrapped-line hanging indent every clause gets

// The real width left for a clause's own text after its own hanging indent eats into the page's
// column — used for both real word-wrap measurement (see lib/chapterPagination.ts) and the CSS
// the clause itself renders with.
export function clauseColumnWidthPx(columnWidthPx: number): number {
  return Math.max(columnWidthPx - HANGING_INDENT_PX, 40);
}

// A thin wrapper around one of parseToSenseLines' own strings — kept as its own type (rather
// than every consumer just using `string`) so lib/chapterPagination.ts's own MeasuredClause can
// extend it with real layout measurements alongside the text.
export interface SenseLineClause {
  text: string;
}

export function parseSenseLines(text: string): SenseLineClause[] {
  return splitIntoLines(text).map((line) => ({ text: line }));
}
