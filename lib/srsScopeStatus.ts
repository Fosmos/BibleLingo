import type { MemorizedEntity } from "@/types";
import { isDue } from "@/lib/srs";

// A slice of Scripture a Mind Map node stands for — a whole book, one chapter, or a verse range
// within a chapter (a hall's own range, or a single verse chip's).
export interface SrsScope {
  book: string;
  chapter?: number;
  startVerse?: number;
  endVerse?: number;
}

export interface SrsScopeStatus {
  // Whether any memorized range the reader has in SRS touches this scope at all.
  inSrs: boolean;
  // Whether any of those ranges is due for review right now (see lib/srs.ts's isDue).
  due: boolean;
  // The most recently reviewed of those ranges' own last accuracy (0-100) — undefined until one
  // of them has been reviewed at least once (see SRSState.lastAccuracy).
  lastAccuracy?: number;
}

export const EMPTY_SRS_STATUS: SrsScopeStatus = { inSrs: false, due: false };

export function entitiesInScope(entities: MemorizedEntity[], scope: SrsScope): MemorizedEntity[] {
  return entities.filter((entity) => {
    if (entity.book !== scope.book) return false;
    if (scope.chapter !== undefined && entity.chapter !== scope.chapter) return false;
    if (scope.startVerse !== undefined && entity.endVerse < scope.startVerse) return false;
    if (scope.endVerse !== undefined && entity.startVerse > scope.endVerse) return false;
    return true;
  });
}

// Rolls every SRS range touching `scope` up into the one status its Mind Map node shows: due if
// ANY of them is due, and the last-review % of whichever was reviewed most recently.
export function srsScopeStatus(entities: MemorizedEntity[], scope: SrsScope, now: Date = new Date()): SrsScopeStatus {
  const matching = entitiesInScope(entities, scope);
  if (matching.length === 0) return EMPTY_SRS_STATUS;
  let latest: MemorizedEntity | undefined;
  for (const entity of matching) {
    if (entity.srs.lastAccuracy === undefined || !entity.srs.lastReviewedAt) continue;
    if (!latest || entity.srs.lastReviewedAt > (latest.srs.lastReviewedAt ?? "")) latest = entity;
  }
  return { inSrs: true, due: matching.some((entity) => isDue(entity.srs, now)), lastAccuracy: latest?.srs.lastAccuracy };
}
