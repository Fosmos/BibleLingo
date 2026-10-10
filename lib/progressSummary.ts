import type { MemorizationDay, MemorizedEntity, PathProgress, VerseSegment } from "@/types";
import { parsePathKey, resolvePath } from "@/lib/memorizationContent";
import { buildPathDayPlan } from "@/lib/dayPlan";
import { getChapterVerses } from "@/lib/chapterContent";
import { getCachedChapterVersion } from "@/lib/bibleContentCache";
import { tokenizeVerseWords } from "@/lib/verseWords";
import { findBook } from "@/lib/bibleBooks";
import { getChapterVerseNumbers } from "@/lib/chapterVerseIndex";

function tokenCount(text: string): number {
  return tokenizeVerseWords(text).length;
}

export interface MemorizedVerseEntry {
  verse: VerseSegment;
  version: string;
}

// A chapter/verse/topic path's verses move into "memorized" (spaced review) as soon as the
// lesson that teaches them is done — a single-verse path's one verse the moment its lesson
// finishes, not only after the path's final boss battle. Book mode graduates a whole chapter at
// a time instead (see getMemorizedBookVerses below). Each verse is paired
// with the translation it was actually completed in — a book+chapter's cache slot holds only
// one translation at a time (see lib/bibleContentCache.ts), so entities built from these need
// to remember which one this specific path used, rather than trusting whatever happens to be
// cached there by the time they're later reviewed.
export function getMemorizedVerses(paths: Record<string, PathProgress>): MemorizedVerseEntry[] {
  const memorized: MemorizedVerseEntry[] = [];
  for (const [key, plan] of Object.entries(paths)) {
    const resolved = resolvePath(key);
    if (!resolved) continue;
    const days = buildPathDayPlan(key, resolved.verses, plan);
    const pathKind = parsePathKey(key).kind;

    const earned =
      pathKind === "book"
        ? getMemorizedBookVerses(resolved.verses, days, plan)
        : plan.completedDays >= days.length
          ? resolved.verses.map((verse) => ({ verse, version: plan.version }))
          : days
              .filter((day) => day.kind === "learn" && day.dayNumber <= plan.completedDays)
              .flatMap((day) => day.newVerses.map((verse) => ({ verse, version: plan.version })));
    memorized.push(...earned);
    // Verses the reader said they already knew when choosing this path (see
    // PathProgress.priorKnownVerseCount) are memorized from the start — straight into spaced
    // review, not held back until the rest of their chapter/path is finished.
    const earnedIds = new Set(earned.map((entry) => entry.verse.id));
    for (const verse of resolved.verses.slice(0, plan.priorKnownVerseCount ?? 0)) {
      if (!earnedIds.has(verse.id)) memorized.push({ verse, version: plan.version });
    }
  }
  return memorized;
}

// Book mode has no per-chapter path day left to gate on (the old daily-rotation review and
// chapter boss battle were removed in favor of SRS handling that recall instead) — so a
// chapter counts as memorized once every "learn" day tagged with it has completed, found by
// the highest dayNumber among that chapter's learn days.
function getMemorizedBookVerses(verses: VerseSegment[], days: MemorizationDay[], plan: PathProgress): MemorizedVerseEntry[] {
  const lastLearnDayByChapter = new Map<number, number>();
  for (const day of days) {
    if (day.kind !== "learn" || day.chapterGroup === undefined) continue;
    // Every chapter the lesson has verses in — a lesson can run across a chapter boundary.
    for (const chapter of new Set(day.newVerses.map((verse) => verse.chapter))) {
      lastLearnDayByChapter.set(chapter, Math.max(lastLearnDayByChapter.get(chapter) ?? 0, day.dayNumber));
    }
  }

  const completedChapters = new Set(
    [...lastLearnDayByChapter.entries()]
      .filter(([, lastDayNumber]) => plan.completedDays >= lastDayNumber)
      .map(([chapter]) => chapter),
  );

  return verses.filter((verse) => completedChapters.has(verse.chapter)).map((verse) => ({ verse, version: plan.version }));
}

// A memorized entity (see lib/memorizedEntities.ts) — manual or path-derived alike, every
// one carries `srs` and is under active spaced review — stores a book/chapter/verse range
// rather than the verse text itself, so this resolves each one against the persistent
// chapter cache, same source LearnVerseStage etc. already fetch from. A chapter that was
// fetched once at add-time but has since been evicted or overwritten with a different
// translation (only possible under the ESV storage cap, or by browsing the same chapter
// under another version) is skipped rather than counted with the wrong text, so the word
// total never silently includes a phantom or mistranslated entity — it just undercounts
// until that chapter is fetched again under the entity's own version.
export function getMemorizedEntityVerses(entities: MemorizedEntity[]): VerseSegment[] {
  const memorized: VerseSegment[] = [];
  for (const entity of entities) {
    if (getCachedChapterVersion(entity.book, entity.chapter) !== entity.version) continue;
    const verses = getChapterVerses(entity.book, entity.chapter);
    if (!verses) continue;
    memorized.push(...verses.slice(entity.startVerse - 1, entity.endVerse));
  }
  return memorized;
}

export interface MemorizedStats {
  books: number;
  chapters: number;
  verses: number;
  words: number;
}

// Counted straight from memorizedEntities — every entity in that list (manual or
// path-derived) is, by definition, under active SRS tracking, so any verse in there counts
// as memorized. This is deliberately NOT re-derived from live path resolution
// (getMemorizedVerses) the way it used to be: that depends on each path's chapter/book
// content already being cached (see lib/memorizationContent.ts's resolvePath), so it can
// silently undercount whenever content isn't cached yet, while memorizedEntities is the
// eagerly-synced, persisted source of truth (see store/useProgressStore.ts's completeDay/
// completeBookChapter). Verse and chapter counts come straight from the entities' own
// ranges, so they're accurate even for content the ESV storage cap has since evicted from
// cache — word count is the one figure that genuinely needs the verse text, so it alone can
// undercount an evicted chapter until it's fetched again.
//
// The raw range arithmetic (endVerse - startVerse + 1) would also count a translation's own
// gap verse as one "memorized" — e.g. Mark 11:26, which the ESV omits entirely (see
// lib/bibleProviders/esv.ts) and which lib/chapterChunking.ts already excludes from ever
// filling a lesson's own verse quota. Subtracted back out here whenever the chapter's real
// text is cached (getMemorizedEntityVerses, same call word count already needs) — when it
// isn't, this undercounts by however many gap verses fall in that range until it's fetched
// again, the exact same accepted tradeoff word count already makes.
//
// Books and chapters count only when memorized end to end: a chapter once its spaced-review
// ranges cover every verse in it (a translation's gap verses aside), a book once every one of its
// chapters does. A chapter's verse numbers come from its cached text, or — when the text isn't
// cached (the ESV license only lets half a book's text stay on the device) — from
// lib/chapterVerseIndex.ts, which remembers every chapter's verse numbers once loaded. A chapter
// never loaded on this device can't be checked and is left out until it is (see
// useMemorizedChaptersLoaded.ts, which fetches them for the Memorized page).
function isChapterFullyCovered(entities: MemorizedEntity[]): boolean {
  const { book, chapter } = entities[0];
  const cached = getChapterVerses(book, chapter);
  const verseNumbers = cached?.length
    ? cached.filter((verse) => verse.text.trim().length > 0).map((verse) => verse.verseNumber)
    : getChapterVerseNumbers(book, chapter);
  if (!verseNumbers || verseNumbers.length === 0) return false;
  const covered = new Set<number>();
  for (const entity of entities) {
    for (let verseNumber = entity.startVerse; verseNumber <= entity.endVerse; verseNumber++) covered.add(verseNumber);
  }
  return verseNumbers.every((verseNumber) => covered.has(verseNumber));
}

export function computeMemorizedStats(memorizedEntities: MemorizedEntity[]): MemorizedStats {
  const entitiesByChapter = new Map<string, MemorizedEntity[]>();
  for (const entity of memorizedEntities) {
    const key = `${entity.book}|${entity.chapter}`;
    entitiesByChapter.set(key, [...(entitiesByChapter.get(key) ?? []), entity]);
  }
  let chapters = 0;
  const fullChaptersByBook = new Map<string, number>();
  for (const entities of entitiesByChapter.values()) {
    if (!isChapterFullyCovered(entities)) continue;
    chapters++;
    fullChaptersByBook.set(entities[0].book, (fullChaptersByBook.get(entities[0].book) ?? 0) + 1);
  }
  let books = 0;
  for (const [book, count] of fullChaptersByBook) {
    const chapterCount = findBook(book)?.chapterCount;
    if (chapterCount !== undefined && count >= chapterCount) books++;
  }

  const cachedVerses = getMemorizedEntityVerses(memorizedEntities);
  const cachedEmptyCount = cachedVerses.filter((verse) => verse.text.trim().length === 0).length;
  const rawVerseCount = memorizedEntities.reduce((sum, entity) => sum + (entity.endVerse - entity.startVerse + 1), 0);
  const verses = Math.max(rawVerseCount - cachedEmptyCount, 0);
  const words = cachedVerses.reduce((sum, verse) => sum + tokenCount(verse.text), 0);

  return { books, chapters, verses, words };
}
