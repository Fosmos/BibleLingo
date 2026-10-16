import type { VerseSegment } from "@/types";
import { parseToSenseLines } from "@/lib/senseLines";

// A verse cut down to some of its sense lines — the part a sense-line Learn stage drills
// (lib/learnSteps.ts). The lines are joined with line breaks, which splitIntoLines keeps as the
// line breaks (lib/senseLineSplitting.ts), so the slice shows exactly the verse's own lines.
// Its own id, so a drill keyed on the verse starts over for each slice.
export function senseLineSlice(verse: VerseSegment, [from, to]: [number, number]): VerseSegment {
  const lines = parseToSenseLines(verse.text);
  return { ...verse, id: `${verse.id}#${from}-${to}`, text: lines.slice(from, to + 1).join("\n"), senseLines: [from, to] };
}

// How many sense lines a verse has.
export const senseLineCount = (verse: VerseSegment): number => parseToSenseLines(verse.text).length;
