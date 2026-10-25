// The line-splitting behind lib/senseLines.ts's public API: a verse broken at its punctuation, a
// line under 4 words joined to its neighbour, one over 12 split in two (lib/naturalSenseLines.ts).
//
// A text already cut into lines (a verse's slice of its own lines — lib/senseLineSlice.ts) keeps
// them as they are: verse text itself never holds a line break.
//
// Lines only ever break between words or just before an em-dash, both of which
// tokenizeVerseWords also splits at, so tokenizing each line separately reproduces the verse's
// own word indices (lib/senseLineWordRanges.ts relies on this).
import { naturalSenseLines } from "@/lib/naturalSenseLines";

export function splitIntoLines(text: string): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  if (trimmed.includes("\n")) return trimmed.split("\n").map((line) => line.trim()).filter(Boolean);
  return naturalSenseLines(trimmed);
}
