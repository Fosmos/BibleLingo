import type { VerseSegment } from "@/types";
import { wrapWordsIntoLines, verseNumberDecorationPx } from "@/lib/textMeasurement";
import { parseSenseLines, clauseColumnWidthPx, type SenseLineClause } from "@/lib/senseLines";
import type { PericopeSegment } from "@/lib/pathZones";
import { FIXED_PARCHMENT_FONT_PX } from "@/lib/parchmentFontRange";
import type { PageBudget } from "@/lib/pageBudget";

export interface ChapterPage {
  segments: PericopeSegment[];
}

// One verse's own sense-line clauses, pre-measured against the real column width each one gets
// — see lib/senseLines.ts's clauseColumnWidthPx. Every clause is its own forced line break (no
// more sharing a line with whatever came before it, the way plain paragraph flow used to), so a
// verse's own real line cost is just the sum of these, no marginal "how many lines did this ADD
// on top of what's already there" bookkeeping needed.
interface MeasuredClause extends SenseLineClause {
  lines: number;
}

function measureClauses(verse: VerseSegment, columnWidthPx: number): MeasuredClause[] {
  const clauses = parseSenseLines(verse.text);
  return clauses.map((clause, index) => {
    const words = clause.text.split(/\s+/).filter((word) => word.length > 0);
    // Only the verse's own FIRST clause pays for its number badge — every later clause of the
    // same verse is a plain continuation, same as ChapterVerseRun.tsx's own rule. A
    // continuation fragment (verse.wordOffset set — this verse is the second half of an
    // earlier page-break split) never pays it at all; its own number already showed before it.
    const extraLeadingPx = index === 0 && !verse.wordOffset ? verseNumberDecorationPx(verse.verseNumber, FIXED_PARCHMENT_FONT_PX) : 0;
    const extra = words.map((_, wordIndex) => (wordIndex === 0 ? extraLeadingPx : 0));
    const width = clauseColumnWidthPx(columnWidthPx);
    const lines = wrapWordsIntoLines(words, width, FIXED_PARCHMENT_FONT_PX, extra).length;
    return { ...clause, lines };
  });
}

function totalLines(clauses: MeasuredClause[]): number {
  return clauses.reduce((sum, clause) => sum + clause.lines, 0);
}

// Up to this many verses share one page — never more, and a verse is never split across two
// pages to make room for it (see paginateSegments below): a page holding fewer than 3 whole
// verses because the next one wouldn't fit the line budget is the deliberate trade-off, not a
// verse fractured mid-clause.
const MAX_VERSES_PER_PAGE = 3;

// Packs each segment's own verses onto pages of up to MAX_VERSES_PER_PAGE, never splitting a
// single verse across two pages — a verse that doesn't fit what's left of the current page (or
// the whole empty budget, for one long enough on its own) simply opens the next page instead of
// being fractured mid-clause. ChapterReadingView.tsx shows the pericope title OUTSIDE the card,
// persisting across every page a pericope's verses span, so there's no "does this page open a
// new pericope" bookkeeping here — every page just carries its own segment's real heading/label
// unconditionally.
export function paginateSegments(segments: PericopeSegment[], pageBudget: PageBudget): ChapterPage[] {
  const { linesPerPage, columnWidthPx } = pageBudget;
  const pages: ChapterPage[] = [];

  for (const segment of segments) {
    let pieceIndex = 0;
    let currentVerses: VerseSegment[] = [];
    let currentLines = 0;

    function flush() {
      if (currentVerses.length === 0) return;
      pages.push({
        segments: [
          {
            ...segment,
            key: `${segment.key}-p${pieceIndex++}`,
            startVerse: currentVerses[0].verseNumber,
            endVerse: currentVerses[currentVerses.length - 1].verseNumber,
            verses: currentVerses,
          },
        ],
      });
      currentVerses = [];
      currentLines = 0;
    }

    for (const verse of segment.verses) {
      const measured = measureClauses(verse, columnWidthPx);
      if (measured.length === 0) continue; // empty/whitespace-only verse — nothing to place.
      const verseLines = totalLines(measured);
      const atCountLimit = currentVerses.length >= MAX_VERSES_PER_PAGE;
      // Only counts against a page that already holds something — a lone verse longer than the
      // whole budget still gets its own page rather than looping forever trying to fit it.
      const wouldOverflow = currentVerses.length > 0 && currentLines + verseLines > linesPerPage;
      if (atCountLimit || wouldOverflow) flush();
      currentVerses.push(verse);
      currentLines += verseLines;
    }
    flush();
  }
  return pages.length > 0 ? pages : [{ segments: [] }];
}

// Which page a given verse number lands on — opens the book to today's page, not page 1. A
// verse is never split across pages (see paginateSegments above), so each verse number lands on
// exactly one page; `activeWordIndex` is accepted only to keep this call shape compatible with
// every caller still passing it from the earlier mid-verse-split design, and is otherwise unused.
export function pageIndexForVerse(pages: ChapterPage[], verseNumber: number, activeWordIndex?: number): number {
  let bestIndex = -1;
  let bestOffset = -1;
  for (let index = 0; index < pages.length; index++) {
    for (const segment of pages[index].segments) {
      for (const verse of segment.verses) {
        if (verse.verseNumber !== verseNumber) continue;
        if (activeWordIndex === undefined) return index;
        const offset = verse.wordOffset ?? 0;
        if (offset <= activeWordIndex && offset > bestOffset) {
          bestOffset = offset;
          bestIndex = index;
        }
      }
    }
  }
  if (bestIndex >= 0) return bestIndex;
  return 0;
}

// The Learn flow's own "fixed page of surrounding verses" (see LessonVerseContext.tsx) is
// otherwise unbounded — a whole day's verses plus a neighbor each side, handed to the same
// fixed-height, non-scrolling ParchmentCard the reading view only ever shows ONE PAGE'S worth
// of at a time. Runs the reading view's own budget/packing over the SAME window, returning
// just the page containing `activeVerseId` — matched by verse id (not number) since the
// window can start in the previous chapter, where verse numbers can collide with the current one.
export interface VerseWindow {
  verses: VerseSegment[];
  heading: string; // "" once past the page holding the heading, same rule paginateSegments applies
}

export function paginateVerseWindow(verses: VerseSegment[], heading: string | undefined, activeVerseId: string, pageBudget: PageBudget): VerseWindow {
  if (verses.length === 0) return { verses, heading: heading ?? "" };
  const pseudoSegment: PericopeSegment = {
    key: "window",
    label: "",
    heading: heading ?? "",
    book: verses[0].book,
    chapter: verses[0].chapter,
    startVerse: verses[0].verseNumber,
    endVerse: verses[verses.length - 1].verseNumber,
    verses,
  };
  const pages = paginateSegments([pseudoSegment], pageBudget);
  const page = pages.find((candidate) => candidate.segments.some((segment) => segment.verses.some((verse) => verse.id === activeVerseId))) ?? pages[0];
  const segments = page?.segments ?? [pseudoSegment];
  return { verses: segments.flatMap((segment) => segment.verses), heading: segments[0]?.heading ?? "" };
}
