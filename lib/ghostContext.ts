import type { VerseSegment } from "@/types";
import type { ChapterPage } from "@/lib/chapterPagination";

export interface GhostContext {
  previousEdgeVerse: VerseSegment | undefined;
  nextEdgeVerse: VerseSegment | undefined;
  prevGhostText: string | undefined;
  nextGhostText: string | undefined;
}

// How many words of the neighbor verse a ghost line previews — a peek, not a real second
// clause to read; GhostContextLine.tsx's own `truncate` was letting this run as long as
// whatever the edge verse's own last/first clause happened to be, which could be a whole line
// on a long clause. A fixed word count reads consistently short no matter which verse it is.
const GHOST_WORD_COUNT = 5;

function lastWords(text: string, count: number): string {
  const words = text.trim().split(/\s+/).filter(Boolean);
  return words.slice(Math.max(0, words.length - count)).join(" ");
}

function firstWords(text: string, count: number): string {
  const words = text.trim().split(/\s+/).filter(Boolean);
  return words.slice(0, count).join(" ");
}

// The last verse of a page's own last segment / the first verse of a page's own first segment
// — the "edge" this page joins onto its neighbor at, used for the ghost-context lines above/
// below the card (see GhostContextLine.tsx). Undefined for a page with no real content yet
// (still loading) or genuinely no neighbor in that direction.
function lastVerseOf(page: ChapterPage | undefined): VerseSegment | undefined {
  const segment = page?.segments[page.segments.length - 1];
  return segment?.verses[segment.verses.length - 1];
}
function firstVerseOf(page: ChapterPage | undefined): VerseSegment | undefined {
  return page?.segments[0]?.verses[0];
}

// The neighbor verse (and a short GHOST_WORD_COUNT-word preview of it) just before/after
// `pages[pageIndex]` — shared by ChapterReadingView.tsx and LessonPageCard.tsx so both render
// the exact same ghost-line content for the exact same page. `pageIndex` at either end of
// `pages` naturally yields undefined for whichever side has no neighbor. The preview takes the
// neighbor verse's own LAST words for the one before this page (its tail end is what's just
// off the top edge) and its own FIRST words for the one after (its opening is what's just off
// the bottom edge) — never a whole clause, which could run far longer than this is meant to.
export function computeGhostContext(pages: ChapterPage[], pageIndex: number): GhostContext {
  const previousEdgeVerse = pageIndex > 0 ? lastVerseOf(pages[pageIndex - 1]) : undefined;
  const nextEdgeVerse = pageIndex < pages.length - 1 ? firstVerseOf(pages[pageIndex + 1]) : undefined;
  return {
    previousEdgeVerse,
    nextEdgeVerse,
    prevGhostText: previousEdgeVerse ? lastWords(previousEdgeVerse.text, GHOST_WORD_COUNT) : undefined,
    nextGhostText: nextEdgeVerse ? firstWords(nextEdgeVerse.text, GHOST_WORD_COUNT) : undefined,
  };
}
