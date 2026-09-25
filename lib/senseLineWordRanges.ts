import { tokenizeVerseWords } from "@/lib/verseWords";
import { parseSenseLines, type SenseLineClause } from "@/lib/senseLines";
import { measureTextWidth } from "@/lib/textMeasurement";

export interface SenseLineWordRange {
  clause: SenseLineClause;
  // [startIndex, endIndex) into tokenizeVerseWords(text) for THIS clause's own words — the
  // same tokenizer every drill's own per-word state (typing progress, draw tokens, first-
  // letter reveal, ...) already indexes into (see lib/verseWords.ts), not lib/senseLines.ts's
  // own simpler internal `wordsOf` (used only to decide where a LINE BREAKS, a different
  // concern from "which word is at which index").
  startIndex: number;
  endIndex: number;
}

// Pairs parseSenseLines' own clause list with each clause's own tokenizeVerseWords index range
// — lets a caller that owns ONE continuous per-word array/state (a drill's own reveal
// progress) slice it by these same boundaries and render through the exact same multi-line
// clause structure a plain, non-active verse already gets (see SenseLineVerse.tsx's own
// `renderVerseWords`), instead of collapsing into one dense, un-indented block. Safe because a
// clause boundary only ever falls on a whitespace boundary (parseSenseLines never cuts mid-
// word), so tokenizing each clause's own text separately and summing always reproduces
// tokenizeVerseWords(text) itself, word for word, in the same order. Split out of
// lib/senseLines.ts purely to keep that file under this codebase's own 200-line file cap — no
// behavior difference from having it there.
export function senseLineWordRanges(text: string): SenseLineWordRange[] {
  let cursor = 0;
  return parseSenseLines(text).map((clause) => {
    const wordCount = tokenizeVerseWords(clause.text).length;
    const range: SenseLineWordRange = { clause, startIndex: cursor, endIndex: cursor + wordCount };
    cursor += wordCount;
    return range;
  });
}

// Share of the column a merged line may fill, measured against plain text. Drills swap words for
// slightly wider spans (a boxed blank, a tinted role wash) and verse text itself renders a touch
// lighter than the bold measurement below, so this headroom keeps a merged line from wrapping.
const MERGE_FILL_RATIO = 0.94;

// Greedily joins consecutive clauses onto ONE line whenever the joined text still fits the
// column — two short clauses ("and peace," "and love,") read as one line rather than two
// half-empty ones, while a clause that's already long keeps its own line. Measured with real
// font metrics (lib/textMeasurement.ts), bold for a conservative width. A merged range spans its
// clauses' combined word range, so every drill's per-range rendering (which slices by
// startIndex/endIndex) needs no change. The first line of a clause starts flush left (see
// SenseLineRow.tsx's hanging indent), so the full column width is what a merged line gets.
export function mergeRangesToFit(ranges: SenseLineWordRange[], columnWidthPx: number, fontSizePx: number): SenseLineWordRange[] {
  if (columnWidthPx <= 0 || ranges.length < 2) return ranges;
  const limit = columnWidthPx * MERGE_FILL_RATIO;
  const merged: SenseLineWordRange[] = [];
  for (const range of ranges) {
    const previous = merged[merged.length - 1];
    const joinedText = previous ? `${previous.clause.text} ${range.clause.text}` : "";
    if (previous && measureTextWidth(joinedText, fontSizePx, "600") <= limit) {
      merged[merged.length - 1] = { clause: { text: joinedText }, startIndex: previous.startIndex, endIndex: range.endIndex };
    } else {
      merged.push(range);
    }
  }
  return merged;
}
