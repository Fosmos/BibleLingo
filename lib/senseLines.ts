// Deterministic sense-line parsing for Bible verse text — breaks a passage into lines of about
// 5–8 words that read as natural phrases, the way a printed sense-line Bible does: every
// sentence starts a new line, and within it lines break at pauses and phrase openings (see
// lib/senseLineSplitting.ts and lib/naturalSenseLines.ts). A line too long for the column still
// wraps under its own hanging indent (SenseLineRow.tsx).

import { splitIntoLines } from "@/lib/senseLineSplitting";
import { isProseMode } from "@/lib/senseLineMode";

// With sense lines off (lib/senseLineMode.ts), a passage is one continuous line that just wraps.
const lines = (text: string): string[] => (isProseMode() ? [text.replace(/\s*\n\s*/g, " ").trim()] : splitIntoLines(text));

// See this file's own top-of-file doc comment.
export function parseToSenseLines(text: string): string[] {
  return lines(text);
}

// Shared with ChapterPageContent.tsx's own rendering so pagination's line-budget math and the
// real on-screen layout can never drift apart — a page is packed to fit exactly the clause
// blocks that will actually render at this same width. Every line renders flush at the SAME
// left margin as the verse's own first line, regardless of which punctuation mark split it off
// — only a genuine mid-clause line WRAP (a browser-wrapped second line of the same clause) hangs
// indented under that clause's own first word (see HANGING_INDENT_PX/SenseLineRow.tsx).
export const HANGING_INDENT_PX = 20; // the wrapped-line hanging indent every clause gets (SenseLineRow.tsx `pl-5`)

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
  return lines(text).map((line) => ({ text: line }));
}
