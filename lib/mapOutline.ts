import { BOOK_THEMES } from "@/lib/bookThemes";
import { formatChapterLabel } from "@/lib/chapterContent";
import type { TrailSection } from "@/lib/trailStops";

// A book or chapter path's map as an outline (MapOutline.tsx): the book's themes (lib/bookThemes.ts),
// each opening to its chapters, each opening to its sections' stones — its pericopes, their reviews
// and the chapter's own review. A section with no verses (the finish line) sits after them all. Pure.
export type OutlineState = TrailSection["state"];

export interface OutlineChapter {
  key: string;
  chapter: number;
  label: string;
  // The map's sections in this chapter, in order (indices into the path's sections).
  indices: number[];
  done: number;
  state: OutlineState;
}

export interface OutlineTheme {
  key: string;
  // Unset for a book without themes — its chapters list straight under the path.
  title?: string;
  range?: string;
  chapters: OutlineChapter[];
  done: number;
  total: number;
  state: OutlineState;
}

export interface MapOutline {
  themes: OutlineTheme[];
  // Sections after the outline — the finish line's whole-path review.
  tail: number[];
}

function rollUp(states: OutlineState[]): OutlineState {
  if (states.length && states.every((state) => state === "complete")) return "complete";
  return states.some((state) => state === "current") ? "current" : "locked";
}

function chapterOf(section: TrailSection): number | undefined {
  return section.stops.flatMap((stop) => stop.verses).at(-1)?.chapter;
}

export function buildMapOutline(book: string, sections: TrailSection[]): MapOutline {
  const chapters = new Map<number, number[]>();
  const tail: number[] = [];
  sections.forEach((section, index) => {
    const chapter = section.reviewOf === "final" ? undefined : chapterOf(section);
    if (chapter === undefined) tail.push(index);
    else chapters.set(chapter, [...(chapters.get(chapter) ?? []), index]);
  });
  const outlineChapters: OutlineChapter[] = [...chapters.entries()].map(([chapter, indices]) => ({
    key: `ch-${chapter}`,
    chapter,
    label: formatChapterLabel(book, chapter),
    indices,
    done: indices.filter((index) => sections[index].state === "complete").length,
    state: rollUp(indices.map((index) => sections[index].state)),
  }));
  const themes = BOOK_THEMES[book] ?? [];
  const grouped: OutlineTheme[] = themes.length
    ? themes.map((theme) => ({
        key: `theme-${theme.id}`,
        title: theme.label,
        range: theme.startChapter === theme.endChapter ? `Chapter ${theme.startChapter}` : `Chapters ${theme.startChapter}–${theme.endChapter}`,
        chapters: outlineChapters.filter((entry) => entry.chapter >= theme.startChapter && entry.chapter <= theme.endChapter),
        done: 0,
        total: 0,
        state: "locked" as const,
      }))
    : [{ key: "all", chapters: outlineChapters, done: 0, total: 0, state: "locked" as const }];
  return {
    themes: grouped
      .filter((theme) => theme.chapters.length > 0)
      .map((theme) => ({
        ...theme,
        done: theme.chapters.filter((chapter) => chapter.state === "complete").length,
        total: theme.chapters.length,
        state: rollUp(theme.chapters.map((chapter) => chapter.state)),
      })),
    tail,
  };
}

// Where the reader is — the first section not yet complete — as the theme and chapter to open.
export function outlinePlace(outline: MapOutline, sections: TrailSection[]): { theme?: string; chapter?: string } {
  const current = sections.findIndex((section) => section.state !== "complete");
  for (const theme of outline.themes) {
    const chapter = theme.chapters.find((entry) => entry.indices.includes(current));
    if (chapter) return { theme: theme.key, chapter: chapter.key };
  }
  return {};
}
