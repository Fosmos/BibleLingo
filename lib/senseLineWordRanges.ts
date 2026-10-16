import { tokenizeVerseWords } from "@/lib/verseWords";
import { parseSenseLines, type SenseLineClause } from "@/lib/senseLines";

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
