import type { MemorizedEntity, PathProgress, SRSState, VerseSegment } from "@/types";
import { getMemorizedVerses } from "@/lib/progressSummary";
import { createInitialSRSState } from "@/lib/srs";

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
  };
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
  const merged: MemorizedEntity = {
    id: entityId(book, chapter, startVerse, endVerse),
    book,
    chapter,
    startVerse,
    endVerse,
    srs: createInitialSRSState(),
    manual: false,
    version,
  };

  const remaining = entities.filter((entity) => entity !== predecessor && entity !== successor);
  return [...remaining, merged];
}

// Rebuilds the path-derived portion of the entity list from current path progress. An
// entity whose verse range is unchanged from before keeps its existing SRS schedule
// (matched by id, which encodes the range); a range that just merged/grew gets a fresh SRS
// schedule, since it now covers different content than what was last reviewed under that id.
// Manually-added entries (see createManualEntity) aren't derived from path progress at all,
// so this rebuild never reconstructs them on its own — they're carried forward as-is,
// dropped only if a completed path has since covered the same verses (avoiding a duplicate
// pair of entities for that range).
export function syncMemorizedEntities(
  paths: Record<string, PathProgress>,
  existingEntities: MemorizedEntity[],
): MemorizedEntity[] {
  const memorizedVerses = getMemorizedVerses(paths);
  const existingById = new Map(existingEntities.map((entity) => [entity.id, entity]));

  let entities: MemorizedEntity[] = [];
  for (const { verse, version } of memorizedVerses) {
    entities = addVerseToEntities(entities, verse, version);
  }
  const pathDerived = entities.map((entity) => existingById.get(entity.id) ?? entity);

  const manualToKeep = existingEntities.filter(
    (entity) =>
      entity.manual && !overlapsExistingEntity(pathDerived, entity.book, entity.chapter, entity.startVerse, entity.endVerse),
  );

  return [...pathDerived, ...manualToKeep];
}
