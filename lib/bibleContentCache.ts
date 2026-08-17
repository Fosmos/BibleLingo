import type { VerseSegment } from "@/types";

// Separate from verses:progress on purpose — this is a content cache (fetched Bible
// text), not user progress, so it isn't versioned/reset alongside the progress schema.
// Bumped to v2 when entries started tracking which translation they hold (see below) —
// old unversioned entries are simply orphaned rather than migrated, since this is
// disposable, refetchable content with no user data at stake.
const CACHE_STORAGE_KEY = "verses:bibleContentCache:v2";

interface ChapterCacheEntry {
  version: string;
  verses: VerseSegment[];
}

type ChapterCache = Record<string, ChapterCacheEntry>;

// Mirrors chapterContent.ts's chapterKey format — kept standalone to avoid a circular
// import between this cache module and chapterContent.ts (which reads from this cache).
function cacheKey(book: string, chapter: number): string {
  return `${book}|${chapter}`;
}

function readCache(): ChapterCache {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(CACHE_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ChapterCache) : {};
  } catch {
    return {};
  }
}

function writeCache(cache: ChapterCache): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(cache));
}

export function getCachedChapter(book: string, chapter: number): VerseSegment[] | undefined {
  return readCache()[cacheKey(book, chapter)]?.verses;
}

// A book+chapter slot only ever holds one translation's text at a time — this is what
// lets a fetch decide whether the cached text actually matches the version just
// requested, instead of trusting stale text fetched under a different translation.
export function getCachedChapterVersion(book: string, chapter: number): string | undefined {
  return readCache()[cacheKey(book, chapter)]?.version;
}

export function setCachedChapter(book: string, chapter: number, version: string, verses: VerseSegment[]): void {
  const cache = readCache();
  cache[cacheKey(book, chapter)] = { version, verses };
  writeCache(cache);
}

export function removeCachedChapter(book: string, chapter: number): void {
  const cache = readCache();
  delete cache[cacheKey(book, chapter)];
  writeCache(cache);
}
