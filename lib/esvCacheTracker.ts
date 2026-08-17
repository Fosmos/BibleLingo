// Tracks how many verses of ESV text are currently persisted in lib/bibleContentCache.ts,
// per book, so lib/bibleApiClient.ts can enforce Crossway's local-storage cap (see
// esvUsageLimits.ts) — evicting the least-recently-used chapter(s) to make room instead of
// blocking new fetches, since Crossway's terms cap what's *stored*, not what's queried or
// displayed (and they explicitly anticipate apps periodically clearing cached text).
// Kept separate from the main content cache because that cache isn't version-keyed (a
// book+chapter slot can hold any version's text); this is the only place that remembers
// "the currently cached text for this chapter happens to be ESV," plus recency order.
const TRACKER_STORAGE_KEY = "verses:esvCacheTracker";

interface EsvChapterEntry {
  chapter: number;
  verseCount: number;
}

// Entries are ordered least-recently-used first, most-recently-used last, per book.
type EsvTracker = Record<string, EsvChapterEntry[]>;

function readTracker(): EsvTracker {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(TRACKER_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as EsvTracker) : {};
  } catch {
    return {};
  }
}

function writeTracker(tracker: EsvTracker): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TRACKER_STORAGE_KEY, JSON.stringify(tracker));
}

export function getEsvCachedVerseCount(book: string): number {
  const entries = readTracker()[book] ?? [];
  return entries.reduce((sum, entry) => sum + entry.verseCount, 0);
}

export function isChapterTrackedAsEsv(book: string, chapter: number): boolean {
  return (readTracker()[book] ?? []).some((entry) => entry.chapter === chapter);
}

// Marks a chapter as just-used (freshly fetched or a cache hit), moving it to the
// most-recently-used end so it's the last thing eviction would remove.
export function touchEsvChapter(book: string, chapter: number, verseCount: number): void {
  const tracker = readTracker();
  const entries = (tracker[book] ?? []).filter((entry) => entry.chapter !== chapter);
  entries.push({ chapter, verseCount });
  tracker[book] = entries;
  writeTracker(tracker);
}

// Removes and returns the least-recently-used tracked chapter for a book, if any — the
// caller is responsible for also deleting its text from the main content cache.
export function evictLeastRecentlyUsedEsvChapter(book: string): EsvChapterEntry | undefined {
  const tracker = readTracker();
  const entries = tracker[book] ?? [];
  const oldest = entries.shift();
  if (oldest) {
    tracker[book] = entries;
    writeTracker(tracker);
  }
  return oldest;
}
