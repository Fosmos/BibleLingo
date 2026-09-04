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

// A second, uncapped, in-memory-only tier — never written to localStorage, never evicted,
// lives only for this tab's session. lib/bibleApiClient.ts's ESV eviction only ever removes
// an entry from the CAPPED persistent tier below (Crossway's storage limit applies to what's
// kept on disk, not what's been fetched this session) — without this, a book long enough to
// exceed that cap (most books over ~100 verses under ESV) would have already-fetched early
// chapters silently vanish from every getCachedChapter caller the moment a later chapter's
// fetch evicts them, even though the verse text itself is still known this session.
const sessionCache: ChapterCache = {};

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

// A verse round-tripped through JSON is only ever malformed one way: `text` missing or
// not a string (see esv.ts's note on gaps in ESV's own verse numbering, and the
// JSON.stringify hole-to-null coercion that used to let one propagate here before that
// was fixed at the source). Treating a malformed chapter as "not cached" — rather than
// returning it as-is — makes every caller's existing "not cached, go fetch it" fallback
// path double as a self-heal for any chapter that was cached before that fix shipped.
function isWellFormedChapter(verses: VerseSegment[] | undefined): verses is VerseSegment[] {
  return Array.isArray(verses) && verses.every((verse) => typeof verse?.text === "string");
}

export function getCachedChapter(book: string, chapter: number): VerseSegment[] | undefined {
  const key = cacheKey(book, chapter);
  const persisted = readCache()[key]?.verses;
  if (isWellFormedChapter(persisted)) return persisted;
  const remembered = sessionCache[key]?.verses;
  return isWellFormedChapter(remembered) ? remembered : undefined;
}

// A book+chapter slot only ever holds one translation's text at a time — this is what
// lets a fetch decide whether the cached text actually matches the version just
// requested, instead of trusting stale text fetched under a different translation.
export function getCachedChapterVersion(book: string, chapter: number): string | undefined {
  const key = cacheKey(book, chapter);
  return readCache()[key]?.version ?? sessionCache[key]?.version;
}

export function setCachedChapter(book: string, chapter: number, version: string, verses: VerseSegment[]): void {
  const key = cacheKey(book, chapter);
  const entry = { version, verses };
  sessionCache[key] = entry;
  const cache = readCache();
  cache[key] = entry;
  writeCache(cache);
}

// Only ever removes the persistent-tier copy (see lib/bibleApiClient.ts's ESV eviction) —
// the session tier deliberately keeps its own copy so this chapter's text stays available
// for the rest of the tab's session even after its on-disk slot is reclaimed.
export function removeCachedChapter(book: string, chapter: number): void {
  const cache = readCache();
  delete cache[cacheKey(book, chapter)];
  writeCache(cache);
}
