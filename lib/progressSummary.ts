import type { MemorizationDay, MemorizedEntity, PathProgress, VerseSegment } from "@/types";
import { resolvePath } from "@/lib/memorizationContent";
import { buildPathDayPlan } from "@/lib/dayPlan";
import { getChapterVerses } from "@/lib/chapterContent";
import { getCachedChapterVersion } from "@/lib/bibleContentCache";
import { tokenizeVerseWords } from "@/lib/verseWords";

// Takes `verses` explicitly rather than re-resolving them from the client-side content
// cache itself — callers that already fetched their own copy (e.g. TodayVersesCard, which
// has to fall back to ensurePathVerses()'s direct return value for ESV book-mode paths
// whose storage cap means the persistent cache can never hold every chapter at once — see
// ensureChapterLoaded) would otherwise silently lose that content on a second, cache-only
// lookup here.
export function getCurrentDay(key: string, verses: VerseSegment[], plan: PathProgress): MemorizationDay | undefined {
  const days = buildPathDayPlan(key, verses, plan);
  const nextDayNumber = Math.min(plan.completedDays + 1, days.length);
  return days.find((day) => day.dayNumber === nextDayNumber);
}

function tokenCount(text: string): number {
  return tokenizeVerseWords(text).length;
}

export interface MemorizedVerseEntry {
  verse: VerseSegment;
  version: string;
}

// A path's verses only move into "memorized" once the whole path is finished — every day
// completed through the final boss-battle day, not just individual learn days along the way.
// Each verse is paired with the translation it was actually completed in — a book+chapter's
// cache slot holds only one translation at a time (see lib/bibleContentCache.ts), so
// entities built from these need to remember which one this specific path used, rather than
// trusting whatever happens to be cached there by the time they're later reviewed.
export function getMemorizedVerses(paths: Record<string, PathProgress>): MemorizedVerseEntry[] {
  const memorized: MemorizedVerseEntry[] = [];
  for (const [key, plan] of Object.entries(paths)) {
    const resolved = resolvePath(key);
    if (!resolved) continue;
    const days = buildPathDayPlan(key, resolved.verses, plan);
    if (plan.completedDays >= days.length) {
      memorized.push(...resolved.verses.map((verse) => ({ verse, version: plan.version })));
    }
  }
  return memorized;
}

// Manual entries (see lib/memorizedEntities.ts) store a book/chapter/verse range rather
// than the verse text itself — this resolves each one against the persistent chapter cache,
// same source LearnVerseStage etc. already fetch from. A chapter that was fetched once at
// add-time but has since been evicted or overwritten with a different translation (only
// possible under the ESV storage cap, or by browsing the same chapter under another
// version) is skipped rather than counted with the wrong text, so word/verse totals never
// silently include a phantom or mistranslated entity — they just undercount until that
// chapter is fetched again under the entity's own version.
export function getManuallyMemorizedVerses(entities: MemorizedEntity[]): VerseSegment[] {
  const memorized: VerseSegment[] = [];
  for (const entity of entities) {
    if (!entity.manual) continue;
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

// Verse and chapter counts come straight from path progress / entity ranges — never from
// re-resolving cached chapter text — so they're accurate even for a manually-added book
// whose chapters exceed the ESV storage cap (see ensureChapterLoaded) and have since evicted
// each other from the cache. Word count is the one figure that genuinely needs the verse
// text, so it alone can undercount an evicted manual chapter until that chapter is fetched
// again — everything else about "how much is memorized" stays correct regardless.
export function computeMemorizedStats(
  paths: Record<string, PathProgress>,
  memorizedEntities: MemorizedEntity[],
): MemorizedStats {
  const pathVerses = getMemorizedVerses(paths).map((entry) => entry.verse);
  const manualEntities = memorizedEntities.filter((entity) => entity.manual);

  const chapterKeys = new Set<string>();
  for (const verse of pathVerses) chapterKeys.add(`${verse.book}|${verse.chapter}`);
  for (const entity of manualEntities) chapterKeys.add(`${entity.book}|${entity.chapter}`);

  const manualVerseCount = manualEntities.reduce((sum, entity) => sum + (entity.endVerse - entity.startVerse + 1), 0);
  const verses = pathVerses.length + manualVerseCount;

  const words =
    pathVerses.reduce((sum, verse) => sum + tokenCount(verse.text), 0) +
    getManuallyMemorizedVerses(memorizedEntities).reduce((sum, verse) => sum + tokenCount(verse.text), 0);

  return { chapters: chapterKeys.size, verses, words };
}
