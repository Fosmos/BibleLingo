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

function readCache(): PericopeCache {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(CACHE_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PericopeCache) : {};
  } catch {
    return {};
  }
}

function writeCache(cache: PericopeCache): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(cache));
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
