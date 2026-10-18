import { BOOK_THEMES } from "@/lib/bookThemes";
import type { TrailSection } from "@/lib/trailStops";

export interface MapThemePage {
  title: string;
  // "Chapters 1–11" / "Chapter 12"
  range: string;
  // Which of the map's sections sit on this page, in order.
  indices: number[];
}

// A book path's map split into pages, one per theme of the book (lib/bookThemes.ts) — each section
// on the page of the theme its last verse's chapter falls in (so the finish line's whole-book
// review lands on the last page); a section with no verses stays on the page before it. Themes the path never reaches have no
// page. Null for a book without themes: its map is one page.
export function mapThemePages(book: string, sections: TrailSection[]): MapThemePage[] | null {
  const themes = BOOK_THEMES[book];
  if (!themes?.length) return null;
  const pages: MapThemePage[] = themes.map((theme) => ({
    title: theme.label,
    range: theme.startChapter === theme.endChapter ? `Chapter ${theme.startChapter}` : `Chapters ${theme.startChapter}–${theme.endChapter}`,
    indices: [],
  }));
  let current = 0;
  sections.forEach((section, index) => {
    const chapter = section.stops.flatMap((stop) => stop.verses).at(-1)?.chapter;
    const at = chapter === undefined ? -1 : themes.findIndex((theme) => chapter >= theme.startChapter && chapter <= theme.endChapter);
    if (at >= 0) current = at;
    pages[current].indices.push(index);
  });
  const reached = pages.filter((page) => page.indices.length > 0);
  return reached.length > 1 ? reached : null;
}
