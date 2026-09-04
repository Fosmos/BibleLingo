// SERVER ONLY — reads ESV_API_KEY. Never import this from a "use client" component;
// only app/api/bible/chapter/route.ts (a server-only Route Handler) should call it.
import type { BibleBook } from "@/types";

const ESV_API_BASE = "https://api.esv.org/v3/passage/text";

export class EsvApiError extends Error {}

// ESV API embeds verse numbers as "[N] " directly in the text — an unambiguous,
// well-documented marker, so no HTML parsing is needed here (unlike api.bible). Some
// verses are combined by the translators under a single range marker like "[3-4]" (the
// original regex only matched single numbers, so a range marker fell through as plain
// body text — silently merging that verse boundary into the previous verse's text and
// shifting every later verse in the chapter back by one index).
function parseEsvPassage(text: string): string[] {
  const markers: { startVerse: number; endVerse: number; start: number; end: number }[] = [];
  const pattern = /\[(\d+)(?:[-–](\d+))?\]\s*/g;
  for (const match of text.matchAll(pattern)) {
    const startVerse = Number(match[1]);
    const endVerse = match[2] ? Number(match[2]) : startVerse;
    markers.push({ startVerse, endVerse, start: match.index, end: match.index + match[0].length });
  }

  const verses: string[] = [];
  markers.forEach((marker, index) => {
    const nextStart = markers[index + 1]?.start ?? text.length;
    const segmentText = text
      .slice(marker.end, nextStart)
      .replace(/\s+/g, " ")
      .trim();
    // A combined range shares its text across every verse number it covers, so the
    // returned array stays index-aligned with verse numbers (verse N at index N-1) —
    // every downstream lookup (chapter slicing, SRS ranges) depends on that alignment.
    for (let verseNumber = marker.startVerse; verseNumber <= marker.endVerse; verseNumber += 1) {
      verses[verseNumber - 1] = segmentText;
    }
  });

  // Some verses present in other manuscript traditions are omitted entirely by the ESV
  // (e.g. Mark 7:16, 9:44, 9:46, 11:26, 15:28) — their verse number never appears as a
  // marker at all, leaving a gap in the array above. Left as a genuine hole, that gap
  // round-trips through JSON (localStorage caching) as an explicit `null` array element,
  // which crashes every downstream consumer expecting a real VerseSegment. An empty
  // string keeps the array dense and every verse number resolvable, at the cost of that
  // one verse having nothing to review/type — which is also just true to the translation.
  for (let index = 0; index < verses.length; index += 1) {
    if (verses[index] === undefined) verses[index] = "";
  }

  return verses;
}

export interface EsvPericope {
  heading: string;
  // The first verse this heading's section covers — the section runs until the next
  // heading's startVerse (exclusive) or the chapter's end, computed by the caller (see
  // lib/chapterPericopes.ts) since that needs the chapter's actual verse count, which this
  // headings-only request doesn't return.
  startVerse: number;
}

// A heading (e.g. "John the Baptist Prepares the Way") appears in the ESV API's own text
// output as a standalone line, sandwiched between blank lines, directly before the verse
// marker it introduces — e.g. "...baptize you with the Holy Spirit.”\n\nThe Baptism of
// Jesus\n\n  [9] In those days..." (confirmed against a live api.esv.org response). Ordinary
// verse-to-verse text never has a text line isolated by blank lines on both sides like that,
// so this reliably distinguishes a real heading from body text — including the chapter's very
// first heading, which has no leading blank line since it opens the passage (the `^` branch).
// A psalm's own superscription (e.g. "A Psalm of David.") is a second such isolated line
// immediately after the real heading — the non-capturing group swallows any number of these
// so only the first (the actual section heading) is captured; the optional trailing "." on
// both handles a superscription's own sentence-ending period, which a plain title never has.
const HEADING_PATTERN = /(?:^|\n\n)([A-Za-z][^\n[\]]*?[a-zA-Z])\.?\n\n(?:[A-Za-z][^\n[\]]*?[a-zA-Z]\.?\n\n)*\s*\[(\d+)\]/g;

function parseEsvHeadings(text: string): EsvPericope[] {
  const pericopes: EsvPericope[] = [];
  for (const match of text.matchAll(HEADING_PATTERN)) {
    pericopes.push({ heading: match[1].trim(), startVerse: Number(match[2]) });
  }
  return pericopes;
}

// Headings are always sourced from the ESV regardless of which translation the reader has
// actually selected — a section heading is a structural fact about the chapter, not a
// property of the translation's own wording, and the ESV is the only provider this app has
// section-heading data for (see app/api/bible/pericopes/route.ts). Independent of
// fetchFromEsv's own verse-text fetch/cache (lib/bibleContentCache.ts) — this never touches
// that cache and isn't subject to its storage cap (see lib/esvUsageLimits.ts's own note that
// the cap is scoped to stored verse text, not headings).
export async function fetchEsvPericopes(book: BibleBook, chapter: number, apiKey: string): Promise<EsvPericope[]> {
  const reference = book.chapterCount === 1 ? book.name : `${book.name} ${chapter}`;
  const query = new URLSearchParams({
    q: reference,
    "include-verse-numbers": "true",
    "include-first-verse-numbers": "true",
    "include-headings": "true",
    "include-footnotes": "false",
    "include-passage-references": "false",
    "include-short-copyright": "false",
  });

  const response = await fetch(`${ESV_API_BASE}/?${query}`, {
    headers: { Authorization: `Token ${apiKey}` },
  });

  if (!response.ok) {
    const message =
      response.status === 401 || response.status === 403
        ? "Invalid ESV_API_KEY."
        : `Couldn't load section headings for ${book.name} ${chapter} (ESV) from api.esv.org (${response.status}).`;
    throw new EsvApiError(message);
  }

  const json = await response.json();
  const passage: string = json.passages?.[0] ?? "";
  return parseEsvHeadings(passage);
}

export async function fetchFromEsv(book: BibleBook, chapter: number, apiKey: string): Promise<string[]> {
  // For a single-chapter book (Obadiah, Philemon, 2 John, 3 John, Jude), the ESV API's
  // reference parser reads a trailing number as a VERSE, not a chapter — "Jude 1" comes
  // back as just Jude 1:1 instead of the whole chapter. The book name alone is
  // unambiguous for these (there's only one chapter to mean).
  const reference = book.chapterCount === 1 ? book.name : `${book.name} ${chapter}`;
  const query = new URLSearchParams({
    q: reference,
    "include-verse-numbers": "true",
    "include-first-verse-numbers": "true",
    "include-headings": "false",
    "include-footnotes": "false",
    "include-passage-references": "false",
    "include-short-copyright": "false",
  });

  const response = await fetch(`${ESV_API_BASE}/?${query}`, {
    headers: { Authorization: `Token ${apiKey}` },
  });

  if (!response.ok) {
    const message =
      response.status === 401 || response.status === 403
        ? "Invalid ESV_API_KEY."
        : `Couldn't load ${book.name} ${chapter} (ESV) from api.esv.org (${response.status}).`;
    throw new EsvApiError(message);
  }

  const json = await response.json();
  const passage: string = json.passages?.[0] ?? "";
  const verses = parseEsvPassage(passage);

  if (verses.length === 0) {
    throw new EsvApiError("Couldn't parse any verses from the ESV API's response for this chapter.");
  }

  return verses;
}
