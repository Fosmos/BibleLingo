import type { VerseSegment } from "@/types";
import { buildVerseSegments, parseChapterKey } from "@/lib/chapterContent";
import { getCachedChapter, getCachedChapterVersion, setCachedChapter, removeCachedChapter } from "@/lib/bibleContentCache";
import { getEsvBookVerseCap } from "@/lib/esvUsageLimits";
import { getEsvCachedVerseCount, touchEsvChapter, evictLeastRecentlyUsedEsvChapter } from "@/lib/esvCacheTracker";
import { findBook } from "@/lib/bibleBooks";
import { mapWithConcurrency } from "@/lib/fetchWithConcurrency";
import { parsePathKey, resolvePath } from "@/lib/memorizationContent";

export class BibleFetchError extends Error {}

// Fetches a chapter's verse text (via our own /api/bible/chapter proxy, which holds the
// api.bible/ESV keys server-side) and caches it. A book+chapter slot only ever holds one
// translation's text at a time — the cache tracks which one, so switching a slot to a
// different version (e.g. re-picking the same chapter under ESV after it was previously
// cached under KJV) always refetches instead of silently reusing the wrong translation's
// text under the newly-selected version's label.
export async function ensureChapterLoaded(book: string, chapter: number, version: string): Promise<VerseSegment[]> {
  const cached = getCachedChapter(book, chapter);
  if (cached && getCachedChapterVersion(book, chapter) === version) {
    if (version === "ESV") touchEsvChapter(book, chapter, cached.length);
    return cached;
  }

  const response = await fetch(
    `/api/bible/chapter?book=${encodeURIComponent(book)}&chapter=${chapter}&version=${encodeURIComponent(version)}`,
  );
  const json = await response.json();

  if (!response.ok) {
    throw new BibleFetchError(json.error ?? `Couldn't load ${book} ${chapter}.`);
  }

  const verses = buildVerseSegments(book, chapter, json.verses as string[]);

  // Crossway's free ESV API terms cap locally stored text at 500 verses or half of any
  // book, whichever is less (https://api.esv.org/docs/) — checked here, the one place
  // every ESV fetch passes through. Rather than blocking new chapters once the cap is
  // hit, the least-recently-used cached ESV chapters for this book are evicted to make
  // room — Crossway's own docs anticipate this ("periodically clear cache"), and this
  // module's ensurePathVerses() transparently re-fetches anything evicted the next time
  // it's actually needed, so nothing breaks — it just may re-fetch more often than other
  // translations, which cache forever once fetched. Single/double-chapter books are
  // excepted from the half-book half of that cap (see getEsvBookVerseCap), so this only
  // ever bites longer books.
  if (version === "ESV") {
    const cap = getEsvBookVerseCap(book, findBook(book)?.chapterCount ?? 0);
    if (verses.length > cap) {
      throw new BibleFetchError(
        `${book} ${chapter} alone (${verses.length} verses) exceeds Crossway's ${cap}-verse ESV storage cap for ${book} (500 verses or half the book, whichever is less) — it can't be kept locally even on its own. Try another translation for this chapter.`,
      );
    }
    while (getEsvCachedVerseCount(book) + verses.length > cap) {
      const evicted = evictLeastRecentlyUsedEsvChapter(book);
      if (!evicted) break;
      removeCachedChapter(book, evicted.chapter);
    }
    touchEsvChapter(book, chapter, verses.length);
  }

  setCachedChapter(book, chapter, version, verses);
  return verses;
}

const BOOK_FETCH_CONCURRENCY = 4;

// Full-book assemblies, kept only in memory for the life of this tab — never written to
// localStorage. For ESV, a book whose total verses exceed the license's storage cap can
// never be fully present in the persistent cache at once (see ensureChapterLoaded), so
// re-reading via resolvePath() after fetching would find gaps. This session cache is what
// lets a book-mode ESV path avoid re-fetching all of its chapters on every navigation
// within the same visit, without persisting more than the cap allows.
const sessionBookCache = new Map<string, VerseSegment[]>();

// resolvePath() reads whatever's cached for a book/chapter regardless of version (it has
// no version parameter — most callers just want "the content", version-agnostic). That
// makes it unsafe on its own to decide whether a path's content is fetch-ready for a
// SPECIFIC version: landing directly on a path page whose chapters happen to already be
// cached under a different translation (e.g. a bookmarked/reloaded URL, or reusing a
// component instance across a version-only navigation) would silently show that other
// translation's text under the newly-requested version's label, with no fetch and no
// error. This checks every chapter the path touches against the requested version.
export function pathContentMatchesVersion(key: string, version: string): boolean {
  const { kind, identifier } = parsePathKey(key);

  if (kind === "chapter") {
    const { book, chapter } = parseChapterKey(identifier);
    return getCachedChapterVersion(book, chapter) === version;
  }

  if (kind === "verse") {
    const [book, chapterStr] = identifier.split("|");
    return getCachedChapterVersion(book, Number(chapterStr)) === version;
  }

  if (kind === "book") {
    const chapterCount = findBook(identifier)?.chapterCount ?? 0;
    if (chapterCount === 0) return false;
    for (let chapter = 1; chapter <= chapterCount; chapter += 1) {
      if (getCachedChapterVersion(identifier, chapter) !== version) return false;
    }
    return true;
  }

  // Topic verses are fixed, curated content with no per-translation fetch — version-independent.
  return true;
}

// Fallback for reaching a path page whose content wasn't pre-fetched during selection
// (e.g. a direct/bookmarked link, or a cache that was cleared) — fetches whatever is
// missing, then re-resolves. A no-op if the content is already cached under this version.
export async function ensurePathVerses(key: string, version: string): Promise<VerseSegment[] | undefined> {
  const cached = resolvePath(key)?.verses;
  if (cached && pathContentMatchesVersion(key, version)) return cached;

  const { kind, identifier } = parsePathKey(key);

  if (kind === "chapter") {
    const { book, chapter } = parseChapterKey(identifier);
    await ensureChapterLoaded(book, chapter, version);
    return resolvePath(key)?.verses;
  }

  if (kind === "verse") {
    const [book, chapterStr] = identifier.split("|");
    await ensureChapterLoaded(book, Number(chapterStr), version);
    return resolvePath(key)?.verses;
  }

  if (kind === "book") {
    const sessionKey = `${version}:${identifier}`;
    const sessionCached = sessionBookCache.get(sessionKey);
    if (sessionCached) return sessionCached;

    const chapterCount = findBook(identifier)?.chapterCount ?? 0;
    const chapters = Array.from({ length: chapterCount }, (_, index) => index + 1);
    // Built from each fetch's own return value rather than re-read from the persistent
    // cache afterward — for ESV, earlier chapters may already have been evicted by the
    // time later ones finish fetching (see ensureChapterLoaded), so the cache alone can't
    // be trusted to hold the whole book at once.
    const chapterVerses = await mapWithConcurrency(chapters, BOOK_FETCH_CONCURRENCY, (chapter) =>
      ensureChapterLoaded(identifier, chapter, version),
    );
    const verses = chapterVerses.flat();
    sessionBookCache.set(sessionKey, verses);
    return verses;
  }

  return resolvePath(key)?.verses;
}
