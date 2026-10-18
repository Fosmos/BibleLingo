import type { LocationTagLevel, PathKind } from "@/types";
import type { TrailSection } from "@/lib/trailStops";
import { getPericopeForVerse } from "@/lib/chapterPericopes";
import { locationTagKey } from "@/lib/locationTags";

export interface TrailTag {
  level: LocationTagLevel;
  key: string;
}

const versesOf = (section: TrailSection) => section.stops.flatMap((stop) => (stop.verse ? [stop.verse] : stop.verses));

// The Memory Palace tags (lib/locationTags.ts) a section of a book or chapter path's map takes —
// its pericope's and its chapter's for a pericope section, just the chapter's for a chapter
// review — keyed exactly as the Mind Map keys them (lib/mindMapTagKey.ts), so a tag set on either
// shows on both. Only the scopes turned on in Settings (UserProgress.locationTagLevels).
export function sectionTags(section: TrailSection, levels: LocationTagLevel[]): TrailTag[] {
  const first = versesOf(section)[0];
  if (!first) return [];
  const tags: TrailTag[] = [];
  const pericope = section.review ? undefined : getPericopeForVerse(first.book, first.chapter, first.verseNumber);
  if (pericope && levels.includes("pericope")) {
    tags.push({ level: "pericope", key: locationTagKey({ level: "pericope", book: first.book, chapter: first.chapter, pericopeLabel: pericope.label }) });
  }
  if (levels.includes("chapter")) tags.push({ level: "chapter", key: locationTagKey({ level: "chapter", book: first.book, chapter: first.chapter }) });
  return tags;
}

// The path's own tag on its map's header: the book's for a book path, the chapter's for a chapter path.
export function pathTags(kind: PathKind, sections: TrailSection[], levels: LocationTagLevel[]): TrailTag[] {
  const first = sections.flatMap(versesOf)[0];
  if (!first) return [];
  if (kind === "book" && levels.includes("book")) return [{ level: "book", key: locationTagKey({ level: "book", book: first.book }) }];
  if (kind === "chapter" && levels.includes("chapter")) return [{ level: "chapter", key: locationTagKey({ level: "chapter", book: first.book, chapter: first.chapter }) }];
  return [];
}
