import type { MemorizedEntity, PathProgress, SRSState, VerseSegment } from "@/types";
import { getMemorizedVerses, type MemorizedVerseEntry } from "@/lib/progressSummary";
import { BOX_INTERVAL_DAYS, createInitialSRSState } from "@/lib/srs";

export function entityId(book: string, chapter: number, startVerse: number, endVerse: number): string {
  return `${book}|${chapter}|${startVerse}-${endVerse}`;
}

// A verse range the user added directly (already memorized before using the app), rather
// than one derived from completed path progress.
export function createManualEntity(
  book: string,
  chapter: number,
  startVerse: number,
  endVerse: number,
  srs: SRSState,
  version: string,
): MemorizedEntity {
  return {
    id: entityId(book, chapter, startVerse, endVerse),
    book,
    chapter,
    startVerse,
    endVerse,
    srs,
    manual: true,
    version,
    memorizedAt: new Date().toISOString(),
  };
}

// The range an id names now — itself, or, once a newly learned verse merged it into a bigger range
// (a new id), the range that covers it — so a review started on the old id still lands on it.
export function resolveEntity(entities: MemorizedEntity[], id: string): MemorizedEntity | undefined {
  const exact = entities.find((entity) => entity.id === id);
  if (exact) return exact;
  const match = id.match(/^(.+)\|(\d+)\|(\d+)-(\d+)$/);
  if (!match) return undefined;
  const [book, chapter, start] = [match[1], Number(match[2]), Number(match[3])];
  return entities.find((entity) => entity.book === book && entity.chapter === chapter && start >= entity.startVerse && start <= entity.endVerse);
}

export function overlapsExistingEntity(
  entities: MemorizedEntity[],
  book: string,
  chapter: number,
  startVerse: number,
  endVerse: number,
): boolean {
  return entities.some(
    (entity) =>
      entity.book === book && entity.chapter === chapter && !(entity.endVerse < startVerse || entity.startVerse > endVerse),
  );
}

const DAY_MS = 24 * 60 * 60 * 1000;

// The schedule a range takes when a newly learned verse joins it: the ranges it joins keep theirs —
// whichever is due soonest, at the more frequent box, their review history carried on — so reviewing a
// passage sticks even as the next lesson's verse joins it (it used to start over, due at once). A
// verse with no neighbour starts in box 1, first due tomorrow: the lesson just drilled it.
function joinedSchedule(joined: MemorizedEntity[]): SRSState {
  const now = new Date();
  if (!joined.length) return { ...createInitialSRSState(now), nextDueAt: new Date(now.getTime() + DAY_MS).toISOString() };
  const due = (entity: MemorizedEntity) => (entity.srs.nextDueAt ? new Date(entity.srs.nextDueAt).getTime() : now.getTime());
  const soonest = [...joined].sort((a, b) => due(a) - due(b))[0];
  const history = joined.flatMap((entity) => entity.srs.history ?? []).sort((a, b) => a.at.localeCompare(b.at)).slice(-20);
  // The more frequent box (box numbers don't run in cadence order — lib/srs.ts's BOX_INTERVAL_DAYS).
  const box = joined.reduce((low, entity) => (BOX_INTERVAL_DAYS[entity.srs.box] < BOX_INTERVAL_DAYS[low] ? entity.srs.box : low), soonest.srs.box);
  return { ...soonest.srs, box, history: history.length ? history : undefined };
}

// Merges a newly-memorized verse into the running entity list: extends whichever
// neighbor(s) (previous/next verse in the same book+chapter) already exist, or starts a
// fresh single-verse entity if it has no memorized neighbor yet. Entities are scoped to one
// chapter — they never merge across chapter boundaries — so growth is naturally capped at a
// full chapter, and the next chapter always starts its own entity.
function addVerseToEntities(entities: MemorizedEntity[], verse: VerseSegment, version: string): MemorizedEntity[] {
  const { book, chapter, verseNumber } = verse;
  const alreadyCovered = entities.some(
    (entity) =>
      entity.book === book &&
      entity.chapter === chapter &&
      verseNumber >= entity.startVerse &&
      verseNumber <= entity.endVerse,
  );
  if (alreadyCovered) return entities;

  const predecessor = entities.find(
    (entity) => entity.book === book && entity.chapter === chapter && entity.endVerse === verseNumber - 1,
  );
  const successor = entities.find(
    (entity) => entity.book === book && entity.chapter === chapter && entity.startVerse === verseNumber + 1,
  );

  const startVerse = predecessor?.startVerse ?? verseNumber;
  const endVerse = successor?.endVerse ?? verseNumber;
  // The earliest of the ranges it joins; unknown when one of them predates dates being kept.
  const now = new Date().toISOString();
  const joined = [predecessor, successor].filter((entity) => entity !== undefined);
  const memorizedAt = joined.some((entity) => !entity.memorizedAt) ? undefined : [now, ...joined.map((entity) => entity.memorizedAt ?? now)].sort()[0];
  const merged: MemorizedEntity = {
    id: entityId(book, chapter, startVerse, endVerse),
    book,
    chapter,
    startVerse,
    endVerse,
    srs: joinedSchedule(joined),
    manual: false,
    version,
    memorizedAt,
    lastAddedAt: now,
  };

  const remaining = entities.filter((entity) => entity !== predecessor && entity !== successor);
  return [...remaining, merged];
}

// Book mode's direct completion hook (see store/useProgressStore.ts's completeBookChapter):
// called the moment a chapter's last learn day finishes, with that chapter's own verses
// already in hand from the page that's completing it — unlike syncMemorizedEntities below,
// this never needs the whole book re-resolved from the local chapter cache, which the app's
// own ESV storage cap means can't reliably hold an entire book at once (see
// lib/bibleContentCache.ts). addVerseToEntities always mints a fresh SRS state for whatever
// it builds, so any id (verse range) that already existed has its prior schedule restored
// afterward — this can safely re-run on a chapter that's already been added.
export function addChapterVersesToEntities(
  existingEntities: MemorizedEntity[],
  chapterVerses: VerseSegment[],
  version: string,
): MemorizedEntity[] {
  let built = existingEntities;
  for (const verse of chapterVerses) built = addVerseToEntities(built, verse, version);
  const existingById = new Map(existingEntities.map((entity) => [entity.id, entity]));
  return built.map((entity) => existingById.get(entity.id) ?? entity);
}

// Adds every verse learned on a path that isn't in a range yet, and changes nothing else — a
// catch-up for progress made before verses counted the moment their stone finished (book paths
// used to wait for a whole chapter). Unlike syncMemorizedEntities it never drops a range, so it's
// safe even while some chapters aren't in the local cache. Unchanged ranges keep their schedule.
export function addLearnedVersesToEntities(paths: Record<string, PathProgress>, existingEntities: MemorizedEntity[]): MemorizedEntity[] {
  return addVerseEntriesToEntities(existingEntities, getMemorizedVerses(paths));
}

// The same, for verses already in hand (one path's, from the book the path screen loaded —
// lib/progressSummary.ts's learnedPathVerses).
export function addVerseEntriesToEntities(existingEntities: MemorizedEntity[], entries: MemorizedVerseEntry[]): MemorizedEntity[] {
  let built = existingEntities;
  for (const { verse, version } of entries) built = addVerseToEntities(built, verse, version);
  if (built === existingEntities) return existingEntities;
  const existingById = new Map(existingEntities.map((entity) => [entity.id, entity]));
  return built.map((entity) => existingById.get(entity.id) ?? entity);
}

// Brings the entity list up to date with path progress: every verse learned on a path joins a
// range (merging into its neighbours); nothing is ever taken away. It used to rebuild the
// path-derived ranges from scratch, which silently dropped every range it couldn't re-derive at
// that moment — a whole book path's chapters whenever one of its chapters wasn't in the local
// cache (the ESV storage cap evicts them), and since lessons count each verse as it finishes, that
// rebuild ran after every verse. A range that grows keeps the schedule of the ranges it joined
// (joinedSchedule); one unchanged keeps its own. A manual range already covering a verse just keeps it.
export function syncMemorizedEntities(paths: Record<string, PathProgress>, existingEntities: MemorizedEntity[]): MemorizedEntity[] {
  return addLearnedVersesToEntities(paths, existingEntities);
}
