import type { MindMapDatum } from "@/lib/mindMapHierarchy";
import type { SrsScope } from "@/lib/srsScopeStatus";

// Which slice of Scripture a Mind Map node stands for, for its SRS due/last-review state (see
// lib/srsScopeStatus.ts). Only books, chapters and halls map to one — the broader rings
// (testament, genre, theme) and the root don't carry SRS indicators. A hall whose verse range
// hasn't loaded yet has none either, rather than briefly borrowing its whole chapter's state.
export function srsScopeForDatum(datum: MindMapDatum): SrsScope | undefined {
  if (datum.kind === "book") return { book: datum.name };
  if (datum.kind === "chapter") return { book: datum.book, chapter: datum.chapter };
  if (datum.kind === "pericope") {
    if (datum.rangeStartVerse === undefined || datum.rangeEndVerse === undefined) return undefined;
    return { book: datum.book, chapter: datum.chapter, startVerse: datum.rangeStartVerse, endVerse: datum.rangeEndVerse };
  }
  return undefined;
}
