import type { VerseSegment } from "@/types";
import { tokenizeVerseWords } from "@/lib/verseWords";
import { wrapWordsIntoLines } from "@/lib/textMeasurement";
import type { PericopeSegment } from "@/lib/pathZones";
import { FIXED_PARCHMENT_FONT_PX } from "@/lib/parchmentFontRange";
import type { PageBudget } from "@/lib/pageBudget";

export interface ChapterPage {
  segments: PericopeSegment[];
}

function rawTokensOf(verse: VerseSegment): string[] {
  return verse.text.split(/\s+/).filter((token) => token.length > 0);
}

// How many real, wrapped lines `verse`'s own text takes at this page's column width — the
// exact same greedy wrap the browser's own `<p className="font-serif">` renders, run against
// real measured glyph widths (see lib/textMeasurement.ts), not an estimate.
function verseLineCount(verse: VerseSegment, columnWidthPx: number): number {
  return wrapWordsIntoLines(rawTokensOf(verse), columnWidthPx, FIXED_PARCHMENT_FONT_PX).length;
}

// Splits `verse`'s own `text` into two fragments at a raw whitespace-token boundary (plain
// `split(/\s+/)`, not the scoring tokenizer — good enough to rebuild readable text by joining
// with spaces, the same fidelity lib/verseBatching.ts's joinVerses already accepts for combining
// verse text elsewhere), chosen so the FIRST fragment occupies EXACTLY `roomLines` real wrapped
// lines — the caller already knows the verse doesn't fit in `roomLines` whole, so this always
// leaves at least one raw token for the second fragment. The second fragment's own `wordOffset`
// (see VerseSegment's own doc comment) is computed by re-tokenizing everything before the split
// with the SCORING tokenizer, so it lines up exactly regardless of any punctuation-only token
// tokenizeVerseWords itself drops. Never called on a verse with fewer than 2 raw tokens (nothing
// meaningful to split there — the caller checks first).
function splitVerseAtLineBudget(verse: VerseSegment, roomLines: number, columnWidthPx: number): [VerseSegment, VerseSegment] {
  const rawTokens = rawTokensOf(verse);
  const lineWordCounts = wrapWordsIntoLines(rawTokens, columnWidthPx, FIXED_PARCHMENT_FONT_PX);
  const wordsToTake = lineWordCounts.slice(0, roomLines).reduce((sum, count) => sum + count, 0);
  const rawIndex = Math.max(1, Math.min(wordsToTake, rawTokens.length - 1));
  const firstText = rawTokens.slice(0, rawIndex).join(" ");
  const secondText = rawTokens.slice(rawIndex).join(" ");
  const wordOffset = (verse.wordOffset ?? 0) + tokenizeVerseWords(firstText).length;
  return [
    { ...verse, text: firstText },
    { ...verse, text: secondText, wordOffset },
  ];
}

// Groups pericope segments (see lib/pathZones.ts's versesByPericopeSegment) into pages, packed
// one VERSE at a time against the page's own real LINE budget (see lib/pageBudget.ts) rather
// than an estimated word count — a segment only splits mid-pericope when it genuinely has to,
// so the common case (a pericope that fits) still lands on one page with its heading intact.
// Nothing stops accumulating just because a segment boundary was crossed — a short pericope with
// room left pulls in the NEXT one's verses (new heading and all) instead of leaving that room
// empty. A verse that doesn't fit the room left on the current page — including one longer than
// a whole EMPTY page — SPLITS across the page break (see splitVerseAtLineBudget above and
// VerseSegment's own `wordOffset`) at the exact line it runs out of room, rather than standing
// alone unsplit or getting bumped whole to the next page: the reader explicitly wants every
// page packed as full as it can genuinely hold, not a page left with blank space at the bottom
// for the sake of never crossing a verse boundary. A pericope heading always costs exactly ONE
// line of the budget — it renders as its own small caption (see ParchmentHeadingCaption.tsx),
// not as part of the verse text's own line-wrapped run, so it's charged separately, once per
// HEADING actually placed, with the same "only flush if something's already on the page" guard
// a verse gets.
export function paginateSegments(segments: PericopeSegment[], pageBudget: PageBudget): ChapterPage[] {
  const { linesPerPage, columnWidthPx } = pageBudget;
  const pages: ChapterPage[] = [];
  let current: PericopeSegment[] = [];
  let currentLines = 0;

  function flushPage() {
    if (current.length > 0) {
      pages.push({ segments: current });
      current = [];
    }
    // Reset unconditionally, even when there was nothing to actually push: a heading's own
    // one-line cost can raise `currentLines` before anything real ever lands in `current`
    // (piece/current are still empty right then), and the verse-splitting loop below relies on
    // a `flushPage()` call always being real forward progress — leaving currentLines stuck
    // non-zero here would spin that loop forever instead.
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

    if (segment.heading) {
      if (currentLines > 0 && currentLines + 1 > linesPerPage) flushPage();
      currentLines += 1;
    }

    for (const startingVerse of segment.verses) {
      let remaining: VerseSegment | undefined = startingVerse;
      // Hard circuit breaker on top of the (proven-terminating) logic below — pagination
      // freezing the whole app is a far worse failure than an occasional cramped page, so this
      // guarantees a way out even if some future edit reintroduces a stuck case: a page never
      // needs more passes than this to place one verse.
      let guard = 1000;
      while (remaining && guard-- > 0) {
        const linesForVerse = verseLineCount(remaining, columnWidthPx);
        const roomLines = linesPerPage - currentLines; // == linesPerPage itself on a fresh page
        if (linesForVerse <= roomLines) {
          piece.push(remaining);
          currentLines += linesForVerse;
          remaining = undefined;
          continue;
        }
        if (roomLines <= 0) {
          // Nothing left to fill on this page at all — move on to a fresh one and re-check the
          // SAME (still whole) verse there, where it usually fits without splitting.
          flushPiece();
          flushPage();
          continue;
        }
        // Doesn't fit, but there's SOME room left — split right here to fill exactly that much
        // rather than leaving it blank and bumping the whole verse to the next page: the
        // reader wants every page packed as full as it can genuinely hold, not a page left with
        // space at the bottom for the sake of never crossing a verse boundary (a verse under 2
        // raw tokens can't usefully divide, so it's the one exception — it just moves on whole).
        if (rawTokensOf(remaining).length < 2) {
          flushPiece();
          flushPage();
          continue;
        }
        const [firstPart, secondPart] = splitVerseAtLineBudget(remaining, roomLines, columnWidthPx);
        piece.push(firstPart);
        currentLines += roomLines;
        flushPiece();
        flushPage();
        remaining = secondPart;
      }
      // The guard tripped (shouldn't happen) — place whatever's left whole rather than silently
      // dropping it, same last-resort the old, pre-splitting code always fell back to.
      if (remaining) {
        piece.push(remaining);
        currentLines += verseLineCount(remaining, columnWidthPx);
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
  // "" once past the page holding the pericope's heading — same "don't repeat a heading atop
  // every page" rule paginateSegments already applies to the reading view itself.
  heading: string;
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
