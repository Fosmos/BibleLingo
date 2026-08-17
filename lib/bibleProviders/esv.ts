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

  return verses;
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
