import type { VerseSegment } from "@/types";
import { getAdjacentVerse } from "@/lib/chapterContent";
import { parseToSenseLines } from "@/lib/senseLines";

// The lesson verse zone's ghost lines (SheetVerseZone.tsx): the last sense line of the verse
// before `edge`, or the first sense line of the verse after it.
export function edgeGhostText(edge: VerseSegment | undefined, side: "previous" | "next"): string | undefined {
  if (!edge) return undefined;
  const neighbour = getAdjacentVerse(edge.book, edge.chapter, edge.verseNumber, side === "previous" ? -1 : 1);
  const lines = neighbour ? parseToSenseLines(neighbour.text) : [];
  return side === "previous" ? lines[lines.length - 1] : lines[0];
}
