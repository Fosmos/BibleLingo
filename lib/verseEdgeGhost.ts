import type { VerseSegment } from "@/types";
import { getAdjacentVerse } from "@/lib/chapterContent";
import { parseToSenseLines } from "@/lib/senseLines";

// The lesson verse zone's ghost lines (SheetVerseZone.tsx): the last sense line of the verse
// before `edge`, or the first sense line of the verse after it — with that verse's number.
export interface EdgeGhost {
  text: string;
  verseNumber: number;
}

export function edgeGhost(edge: VerseSegment | undefined, side: "previous" | "next"): EdgeGhost | undefined {
  if (!edge) return undefined;
  const neighbour = getAdjacentVerse(edge.book, edge.chapter, edge.verseNumber, side === "previous" ? -1 : 1);
  const lines = neighbour ? parseToSenseLines(neighbour.text) : [];
  const text = side === "previous" ? lines[lines.length - 1] : lines[0];
  return neighbour && text ? { text, verseNumber: neighbour.verseNumber } : undefined;
}
