import type { LocationTagLevel } from "@/types";
import type { MindMapDatum } from "@/lib/mindMapTypes";
import { locationTagKey } from "@/lib/locationTags";

// This node's own lib/locationTags.ts key, when the Memory Palace Tags setting has its scope
// turned on (Settings > Advanced — see UserProgress.locationTagLevels) — undefined for a kind
// with no tag concept of its own (theme/genre/subgenre/testament/root — see lib/mindMapTypes.ts)
// or when that scope isn't currently enabled, in which case MindMapNodeCard.tsx renders no tag
// badge at all for this node. The pericope case reuses MindMapPericopeDatum.tagLabel rather than
// its own display `label` — see that field's own doc comment for why they can't be the same
// string.
export function mindMapTagKey(datum: MindMapDatum, locationTagLevels: LocationTagLevel[]): string | undefined {
  if (datum.kind === "book" && locationTagLevels.includes("book")) {
    return locationTagKey({ level: "book", book: datum.name });
  }
  if (datum.kind === "chapter" && locationTagLevels.includes("chapter")) {
    return locationTagKey({ level: "chapter", book: datum.book, chapter: datum.chapter });
  }
  if (datum.kind === "pericope" && locationTagLevels.includes("pericope")) {
    return locationTagKey({ level: "pericope", book: datum.book, chapter: datum.chapter, pericopeLabel: datum.tagLabel });
  }
  return undefined;
}
