// Mirrors lib/bibleContentCache.ts's two-tier cache shape (localStorage-backed persistent
// tier + an uncapped in-memory session tier), but for section-heading data instead of verse
// text — no `version` field, since a heading is always ESV-sourced regardless of which
// translation's text is cached for that same book/chapter (see lib/bibleProviders/esv.ts's
// fetchEsvPericopes), so there's no "does this match the requested version" question to ask.
export interface Pericope {
  heading: string;
  startVerse: number;
}

const CACHE_STORAGE_KEY = "verses:pericopeCache:v1";

type PericopeCache = Record<string, Pericope[]>;

const sessionCache: PericopeCache = {};

function cacheKey(book: string, chapter: number): string {
  return `${book}|${chapter}`;
}

// The last parse, keyed by the stored string it came from — the Mind Map reads section headings
// many times per render, so the stored JSON is only re-parsed when it actually changes (same as
// lib/bibleContentCache.ts).
let parsed: { raw: string; cache: PericopeCache } | null = null;

function readCache(): PericopeCache {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(CACHE_STORAGE_KEY);
    if (!raw) return {};
    if (parsed?.raw !== raw) parsed = { raw, cache: JSON.parse(raw) as PericopeCache };
    return parsed.cache;
  } catch {
    return {};
  }
}

function writeCache(cache: PericopeCache): void {
  if (typeof window === "undefined") return;
  const raw = JSON.stringify(cache);
  try {
    window.localStorage.setItem(CACHE_STORAGE_KEY, raw);
    parsed = { raw, cache };
  } catch (error) {
    parsed = null;
    throw error;
  }
}

export function getCachedPericopes(book: string, chapter: number): Pericope[] | undefined {
  const key = cacheKey(book, chapter);
  return readCache()[key] ?? sessionCache[key];
}

export function setCachedPericopes(book: string, chapter: number, pericopes: Pericope[]): void {
  const key = cacheKey(book, chapter);
  sessionCache[key] = pericopes;
  const cache = readCache();
  cache[key] = pericopes;
  writeCache(cache);
}
