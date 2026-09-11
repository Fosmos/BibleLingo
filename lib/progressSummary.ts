import type { MemorizationDay, MemorizedEntity, PathProgress, VerseSegment } from "@/types";
import { parsePathKey, resolvePath } from "@/lib/memorizationContent";
import { buildPathDayPlan } from "@/lib/dayPlan";
import { getChapterVerses } from "@/lib/chapterContent";
import { getCachedChapterVersion } from "@/lib/bibleContentCache";
import { tokenizeVerseWords } from "@/lib/verseWords";
import { activeDayNumber } from "@/lib/dayRollover";

// Takes `verses` explicitly rather than re-resolving them from the client-side content
// cache itself — callers that already fetched their own copy (e.g. TodayVersesCard, which
// has to fall back to ensurePathVerses()'s direct return value for ESV book-mode paths
// whose storage cap means the persistent cache can never hold every chapter at once — see
// ensureChapterLoaded) would otherwise silently lose that content on a second, cache-only
// lookup here.
//
// "Current" means "the next NEW thing to start" — gated by activeDayNumber (real calendar
// rollover, not raw completedDays; see lib/dayRollover.ts), so this returns undefined once
// today's own lesson is already done rather than quietly handing back tomorrow's not-yet-
// taught verses the instant that lesson finishes. A reader who wants what was just learned
// TODAY specifically (not what's next) wants getLastCompletedDay below instead.
export function getCurrentDay(key: string, verses: VerseSegment[], plan: PathProgress): MemorizationDay | undefined {
  const days = buildPathDayPlan(key, verses, plan);
  const dayNumber = Math.min(activeDayNumber(plan, new Date()), days.length);
  return days.find((day) => day.dayNumber === dayNumber);
}

// The lesson day whose verses were most recently finished, regardless of whether that was
// today or an earlier day — unlike getCurrentDay above, this is never gated by calendar
// rollover, since it names something that already genuinely happened. Used by
// VespersPromptCard, which wants to prompt recall of what was ACTUALLY just learned before
// bed, not preview a lesson that hasn't been taught yet.
export function getLastCompletedDay(key: string, verses: VerseSegment[], plan: PathProgress): MemorizationDay | undefined {
  const days = buildPathDayPlan(key, verses, plan);
  return days.find((day) => day.dayNumber === plan.completedDays);
}

function tokenCount(text: string): number {
  return tokenizeVerseWords(text).length;
}

export interface MemorizedVerseEntry {
  verse: VerseSegment;
  version: string;
}

// A chapter/verse/topic path's verses only move into "memorized" once the whole path is
// finished — every day completed through the final boss-battle day, not just individual
// learn days along the way. Book mode is the exception (see getMemorizedBookVerses below):
// each chapter graduates on its own as soon as it's fully learned, since a whole book can
// take far longer to finish than any one chapter is worth waiting on. Each verse is paired
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

    if (pathKind === "book") {
      memorized.push(...getMemorizedBookVerses(resolved.verses, days, plan));
      continue;
    }

    if (plan.completedDays >= days.length) {
      memorized.push(...resolved.verses.map((verse) => ({ verse, version: plan.version })));
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
    const current = lastLearnDayByChapter.get(day.chapterGroup) ?? 0;
    lastLearnDayByChapter.set(day.chapterGroup, Math.max(current, day.dayNumber));
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
export function computeMemorizedStats(memorizedEntities: MemorizedEntity[]): MemorizedStats {
  const chapterKeys = new Set<string>();
  for (const entity of memorizedEntities) chapterKeys.add(`${entity.book}|${entity.chapter}`);

  const cachedVerses = getMemorizedEntityVerses(memorizedEntities);
  const cachedEmptyCount = cachedVerses.filter((verse) => verse.text.trim().length === 0).length;
  const rawVerseCount = memorizedEntities.reduce((sum, entity) => sum + (entity.endVerse - entity.startVerse + 1), 0);
  const verses = Math.max(rawVerseCount - cachedEmptyCount, 0);
  const words = cachedVerses.reduce((sum, verse) => sum + tokenCount(verse.text), 0);

  return { chapters: chapterKeys.size, verses, words };
}
