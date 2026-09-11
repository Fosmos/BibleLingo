import type { VerseSegment } from "@/types";
import { tokenizeVerseWords } from "@/lib/verseWords";
import { wrapWordsIntoLines } from "@/lib/textMeasurement";
import { rawTokensOf, buildRun, appendVerseToRun, type TokenRun } from "@/lib/verseTokenRun";
import type { PericopeSegment } from "@/lib/pathZones";
import { FIXED_PARCHMENT_FONT_PX } from "@/lib/parchmentFontRange";
import type { PageBudget } from "@/lib/pageBudget";

export interface ChapterPage {
  segments: PericopeSegment[];
}

const HEADING_HEIGHT_PX = 40; // ParchmentHeadingCaption.tsx's real height (`py-3` + `text-xs`), fixed regardless of font size
const SEGMENT_GAP_PX = 12; // ChapterPageContent.tsx's own `gap-3` between sibling segment divs.

// How many real wrapped lines a token run takes — the same greedy wrap the browser renders,
// against real measured glyph widths (see lib/textMeasurement.ts and lib/verseTokenRun.ts).
function lineCountOf(run: TokenRun, columnWidthPx: number): number {
  return wrapWordsIntoLines(run.tokens, columnWidthPx, FIXED_PARCHMENT_FONT_PX, run.extraLeadingPx).length;
}

// A piece's own verses render as ONE continuously flowing `<p>` — a verse can share its opening
// line with the previous verse's trailing words instead of always starting fresh — so its real
// cost is the MARGINAL lines it adds on top of `precedingRun` already placed ahead of it, not
// its line count in isolation (summing standalone counts overcounted by up to a line per verse).
function linesAdded(precedingRun: TokenRun, verse: VerseSegment, columnWidthPx: number): number {
  const combined = appendVerseToRun(precedingRun, verse, FIXED_PARCHMENT_FONT_PX);
  return lineCountOf(combined, columnWidthPx) - lineCountOf(precedingRun, columnWidthPx);
}

// Splits `verse`'s own `text` at a raw whitespace-token boundary, chosen so the FIRST fragment
// adds EXACTLY `roomLines` more real wrapped lines on top of `precedingRun` (see linesAdded
// above — a verse mid-piece can start partway through an already-shared line). Always leaves at
// least one raw token for the second fragment. Its own `wordOffset` re-tokenizes everything
// before the split with the SCORING tokenizer so it lines up exactly despite any punctuation-only
// token tokenizeVerseWords drops. Never called on a verse with fewer than 2 raw tokens.
function splitVerseAtLineBudget(verse: VerseSegment, roomLines: number, columnWidthPx: number, precedingRun: TokenRun): [VerseSegment, VerseSegment] {
  const combined = appendVerseToRun(precedingRun, verse, FIXED_PARCHMENT_FONT_PX);
  const combinedLines = wrapWordsIntoLines(combined.tokens, columnWidthPx, FIXED_PARCHMENT_FONT_PX, combined.extraLeadingPx);
  const baseLines = lineCountOf(precedingRun, columnWidthPx);
  const wordsThroughBudget = combinedLines.slice(0, baseLines + roomLines).reduce((sum, count) => sum + count, 0);
  const rawTokens = rawTokensOf(verse);
  const rawIndex = Math.max(1, Math.min(wordsThroughBudget - precedingRun.tokens.length, rawTokens.length - 1));
  const firstText = rawTokens.slice(0, rawIndex).join(" ");
  const secondText = rawTokens.slice(rawIndex).join(" ");
  const wordOffset = (verse.wordOffset ?? 0) + tokenizeVerseWords(firstText).length;
  return [
    { ...verse, text: firstText },
    { ...verse, text: secondText, wordOffset },
  ];
}

// Groups pericope segments (see lib/pathZones.ts's versesByPericopeSegment) into pages, packed
// one VERSE at a time against the page's own real LINE budget (see lib/pageBudget.ts). A short
// pericope with room left pulls in the NEXT one's verses (new heading and all). A verse that
// doesn't fit the room left — even a whole EMPTY page's worth — SPLITS across the page break
// (see splitVerseAtLineBudget and VerseSegment's own `wordOffset`) rather than bumping whole to
// the next page. A heading and a same-page segment transition each pay their own real pixel cost
// (see HEADING_HEIGHT_PX/SEGMENT_GAP_PX above), not a flat line each.
export function paginateSegments(segments: PericopeSegment[], pageBudget: PageBudget): ChapterPage[] {
  const { linesPerPage, columnWidthPx } = pageBudget;
  const lineHeightPx = FIXED_PARCHMENT_FONT_PX * 2; // Tailwind's `leading-loose`, as in pageBudget.ts
  const pages: ChapterPage[] = [];
  let current: PericopeSegment[] = [];
  let currentLines = 0;

  function flushPage() {
    if (current.length > 0) {
      pages.push({ segments: current });
      current = [];
    }
    // Reset unconditionally: a heading/gap's own cost can raise `currentLines` before anything
    // real lands in `current`, and the splitting loop below needs flushPage() to always progress.
    currentLines = 0;
  }

  for (const segment of segments) {
    let piece: VerseSegment[] = [];
    let pieceIndex = 0;
    let headingUsed = false;

    function flushPiece() {
      if (piece.length === 0) return;
      current.push({
        ...segment,
        key: `${segment.key}-p${pieceIndex++}`,
        heading: headingUsed ? "" : segment.heading,
        label: headingUsed ? "" : segment.label,
        startVerse: piece[0].verseNumber,
        endVerse: piece[piece.length - 1].verseNumber,
        verses: piece,
      });
      headingUsed = true;
      piece = [];
    }

    if (currentLines > 0) {
      const gapLines = SEGMENT_GAP_PX / lineHeightPx;
      if (currentLines + gapLines > linesPerPage) flushPage();
      else currentLines += gapLines;
    }

    if (segment.heading) {
      const headingLines = HEADING_HEIGHT_PX / lineHeightPx;
      if (currentLines > 0 && currentLines + headingLines > linesPerPage) flushPage();
      currentLines += headingLines;
    }

    for (const startingVerse of segment.verses) {
      let remaining: VerseSegment | undefined = startingVerse;
      // Hard circuit breaker on top of the (proven-terminating) logic below — a page never needs
      // more passes than this to place one verse.
      let guard = 1000;
      while (remaining && guard-- > 0) {
        const precedingRun = buildRun(piece, FIXED_PARCHMENT_FONT_PX);
        const linesForVerse = linesAdded(precedingRun, remaining, columnWidthPx);
        // Floored: text only ever renders in whole lines, so a fractional remainder left over
        // from a heading/gap's own real cost can't hold part of another wrapped line.
        const roomLines = Math.floor(linesPerPage - currentLines);
        if (linesForVerse <= roomLines) {
          piece.push(remaining);
          currentLines += linesForVerse;
          remaining = undefined;
          continue;
        }
        if (roomLines <= 0) {
          // Nothing left on this page — move to a fresh one and re-check the same verse there.
          flushPiece();
          flushPage();
          continue;
        }
        // Doesn't fit, but there's SOME room left — split right here rather than bumping the
        // whole verse to the next page (a verse under 2 raw tokens can't usefully divide, so it
        // just moves on whole instead).
        if (rawTokensOf(remaining).length < 2) {
          flushPiece();
          flushPage();
          continue;
        }
        const [firstPart, secondPart] = splitVerseAtLineBudget(remaining, roomLines, columnWidthPx, precedingRun);
        piece.push(firstPart);
        currentLines += roomLines;
        flushPiece();
        flushPage();
        remaining = secondPart;
      }
      // The guard tripped (shouldn't happen) — place whatever's left whole rather than silently
      // dropping it, same last-resort the old, pre-splitting code always fell back to.
      if (remaining) {
        const precedingRun = buildRun(piece, FIXED_PARCHMENT_FONT_PX);
        currentLines += linesAdded(precedingRun, remaining, columnWidthPx);
        piece.push(remaining);
      }
    }
    flushPiece();
  }
  flushPage();
  return pages.length > 0 ? pages : [{ segments: [] }];
}

// Which page a given verse number lands on — opens the book to today's page, not page 1.
export function pageIndexForVerse(pages: ChapterPage[], verseNumber: number): number {
  for (let index = 0; index < pages.length; index++) {
    for (const segment of pages[index].segments) {
      if (segment.verses.some((verse) => verse.verseNumber === verseNumber)) return index;
    }
  }
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
