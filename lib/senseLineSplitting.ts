// The line-splitting behind lib/senseLines.ts's public API. Two steps:
//
// 1. Sentences: split AFTER a real sentence end (. ? ! + any closing quote), so a new sentence
//    always starts a new line, however short either side is. Semicolons and colons are only a
//    pause, handled in step 2.
// 2. Natural lines: each sentence is divided into lines of about 4–6 words where a reader would
//    pause — at punctuation, before "and"/"that"/"who", before a preposition — never leaving a
//    line hanging on "the" or "of" (lib/naturalSenseLines.ts).
//
// A text already cut into lines (a verse's slice of its own lines — lib/senseLineSlice.ts) keeps
// them as they are: verse text itself never holds a line break.
//
// Lines only ever break between words or just before an em-dash, both of which
// tokenizeVerseWords also splits at, so tokenizing each line separately reproduces the verse's
// own word indices (lib/senseLineWordRanges.ts relies on this).
import { naturalSenseLines } from "@/lib/naturalSenseLines";

const HARD_BREAK_PATTERN = /(?<=[.?!]['"’”]*)\s+/;

export function splitIntoLines(text: string): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  if (trimmed.includes("\n")) return trimmed.split("\n").map((line) => line.trim()).filter(Boolean);
  return trimmed
    .split(HARD_BREAK_PATTERN)
    .filter(Boolean)
    .flatMap((sentence) => naturalSenseLines(sentence));
}
