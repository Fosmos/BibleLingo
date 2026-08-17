// SERVER ONLY — reads BIBLE_API_KEY. Never import this from a "use client" component;
// only app/api/bible/chapter/route.ts (a server-only Route Handler) should call it.
import type { BibleBook } from "@/types";

const API_BASE = "https://api.scripture.api.bible/v1";

// Candidate abbreviation/name fragments used to find each version in the caller's
// api.bible account catalog — accounts don't all have the same bibleId per version,
// so we resolve it by searching rather than hardcoding UUIDs.
const VERSION_MATCHERS: Record<string, { abbreviations: string[]; nameContains: string[] }> = {
  KJV: { abbreviations: ["KJV"], nameContains: ["king james"] },
  NIV: { abbreviations: ["NIV"], nameContains: ["new international version"] },
  NASB: { abbreviations: ["NASB", "NASB1995", "NASB2020"], nameContains: ["new american standard"] },
  NLT: { abbreviations: ["NLT"], nameContains: ["new living translation"] },
};

interface ApiBibleSummary {
  id: string;
  abbreviation: string;
  abbreviationLocal: string;
  name: string;
  nameLocal: string;
  language: { id: string };
}

export class ApiBibleError extends Error {}

// Module-scope caches — this server process lives across requests in dev/prod,
// so we avoid re-resolving the same version's bibleId or re-listing bibles every call.
let biblesListCache: ApiBibleSummary[] | null = null;
const bibleIdCache = new Map<string, string>();

async function fetchBiblesList(apiKey: string): Promise<ApiBibleSummary[]> {
  if (biblesListCache) return biblesListCache;
  const response = await fetch(`${API_BASE}/bibles?language=eng`, { headers: { "api-key": apiKey } });
  if (!response.ok) {
    throw new ApiBibleError(
      response.status === 401 || response.status === 403 ? "Invalid api.bible API key." : `api.bible bibles lookup failed (${response.status}).`,
    );
  }
  const json = await response.json();
  biblesListCache = json.data as ApiBibleSummary[];
  return biblesListCache;
}

async function resolveBibleId(versionCode: string, apiKey: string): Promise<string> {
  const cached = bibleIdCache.get(versionCode);
  if (cached) return cached;

  const matcher = VERSION_MATCHERS[versionCode];
  if (!matcher) throw new ApiBibleError(`Unknown Bible version "${versionCode}".`);

  const bibles = await fetchBiblesList(apiKey);
  const match = bibles.find((bible) => {
    const abbreviation = bible.abbreviation?.toUpperCase() ?? "";
    const name = `${bible.name} ${bible.nameLocal}`.toLowerCase();
    return matcher.abbreviations.includes(abbreviation) || matcher.nameContains.some((fragment) => name.includes(fragment));
  });

  if (!match) {
    throw new ApiBibleError(
      `No Bible matching ${versionCode} was found in your api.bible account. Make sure your account has access to this translation.`,
    );
  }

  bibleIdCache.set(versionCode, match.id);
  return match.id;
}

const VERSE_SPAN_PATTERN = /<span(?=[^>]*\bclass="v")(?=[^>]*\bdata-number="(\d+)")[^>]*>[^<]*<\/span>/g;

function decodeEntities(text: string): string {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function parseChapterHtml(html: string): string[] {
  const markers: { start: number; end: number }[] = [];
  for (const match of html.matchAll(VERSE_SPAN_PATTERN)) {
    markers.push({ start: match.index, end: match.index + match[0].length });
  }

  return markers.map((marker, index) => {
    const nextStart = markers[index + 1]?.start ?? html.length;
    const rawSegment = html.slice(marker.end, nextStart);
    return decodeEntities(rawSegment.replace(/<[^>]+>/g, " "))
      .replace(/\s+/g, " ")
      .trim();
  });
}

export async function fetchFromApiBible(book: BibleBook, chapter: number, version: string, apiKey: string): Promise<string[]> {
  const bibleId = await resolveBibleId(version, apiKey);
  const chapterId = `${book.bookId}.${chapter}`;
  const response = await fetch(
    `${API_BASE}/bibles/${bibleId}/chapters/${chapterId}?content-type=html&include-verse-numbers=true&include-titles=false&include-notes=false&include-chapter-numbers=false`,
    { headers: { "api-key": apiKey } },
  );

  if (!response.ok) {
    const message =
      response.status === 401 || response.status === 403
        ? "Invalid api.bible API key."
        : `Couldn't load ${book.name} ${chapter} (${version}) from api.bible (${response.status}).`;
    throw new ApiBibleError(message);
  }

  const json = await response.json();
  const content: string = json.data?.content ?? "";
  const verses = parseChapterHtml(content);

  if (verses.length === 0) {
    throw new ApiBibleError("Couldn't parse any verses from api.bible's response for this chapter — its content format may have changed.");
  }

  return verses;
}
