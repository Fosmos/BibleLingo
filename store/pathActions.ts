import type { StoreApi } from "zustand";
import type { LocationTagLevel, PathProgress, UserProgress } from "@/types";
import type { ProgressStore } from "@/store/useProgressStore";

interface PathActions {
  setPath: (
    pathKey: string,
    version: string,
    versesPerDay?: number,
    locationTagLevels?: LocationTagLevel[],
    sectionEndPegEnabled?: boolean,
    priorKnownVerseCount?: number,
    // How many auto-completed days that verse count actually becomes (see lib/dayPlan.ts's own
    // priorKnownDayCount) — the caller (PathOverviewScreen.tsx) computes this against the
    // path's real verses, since this store action has no verse data of its own to derive it
    // from.
    priorKnownDayCount?: number,
  ) => void;
  resetPathProgress: (pathKey: string) => void;
  setActivePath: (pathKey: string) => void;
}

// Split out of useProgressStore.ts purely to keep that file under this codebase's 200-line
// cap — see store/streakActions.ts for why set/get/persist are passed in rather than imported.
export function createPathActions(
  set: StoreApi<ProgressStore>["setState"],
  get: StoreApi<ProgressStore>["getState"],
  persist: (progress: UserProgress) => UserProgress,
): PathActions {
  return {
    setPath: (pathKey, version, versesPerDay, locationTagLevels, sectionEndPegEnabled, priorKnownVerseCount, priorKnownDays) => {
      const state = get();
      const existing = state.paths[pathKey];
      // Spreads `existing` FIRST rather than naming every field explicitly — a field this
      // function doesn't know to ask for (e.g. PathProgress.lastCompletedAt, set only by
      // completeDay) must never get silently dropped just because setPath ran again over an
      // already-started path (e.g. re-picking the same translation, or a hydration race on a
      // fresh page load re-applying the URL's own version/versesPerDay before the real saved
      // plan has loaded).
      // `priorKnownVerseCount`/`priorKnownDays` only ever matter for a genuinely fresh path (no
      // `existing`) — see GuidedPathFlow.tsx's own "I've already learned some of this"
      // starting-point step, which always calls resetPathProgress right before this. They never
      // override an already-started path's own real values (set once, at creation, and never
      // changed again — see PathProgress's own doc comment).
      const freshPriorKnownVerseCount = existing?.priorKnownVerseCount ?? priorKnownVerseCount;
      const plan: PathProgress = {
        ...existing,
        version,
        // A fresh path with a claimed prior-known prefix starts with exactly that many days
        // (see lib/dayPlan.ts's own priorKnownDayCount — book mode's own prefix can be several
        // days, one per chapter it spans, not always just one) already marked done, so the
        // reader lands straight on the first day of real new content instead of being asked to
        // "do" a lesson that's just the verses they already said they knew.
        completedDays: existing?.completedDays ?? priorKnownDays ?? 0,
        versesPerDay: versesPerDay ?? existing?.versesPerDay,
        locationTagLevels: locationTagLevels ?? existing?.locationTagLevels,
        sectionEndPegEnabled: sectionEndPegEnabled ?? existing?.sectionEndPegEnabled,
        priorKnownVerseCount: freshPriorKnownVerseCount,
      };
      set(persist({ ...state, paths: { ...state.paths, [pathKey]: plan } }));
    },

    // Called right before navigating to a path chosen through the picker flow (GuidedPathFlow's
    // "Switch Path" — see goToPath there) so re-selecting a path you've already made progress
    // in starts over instead of silently resuming wherever you left off. A no-op for a path
    // with no progress yet (nothing to reset) — deleting the entry just lets setPath's own
    // `existing?.completedDays ?? 0` default create a fresh one right after, same as a path
    // that's never been visited at all.
    resetPathProgress: (pathKey) => {
      const state = get();
      const existing = state.paths[pathKey];
      if (!existing || existing.completedDays === 0) return;
      const paths = { ...state.paths };
      delete paths[pathKey];
      const chapterReviewBestAccuracy = { ...state.chapterReviewBestAccuracy };
      delete chapterReviewBestAccuracy[pathKey];
      set(persist({ ...state, paths, chapterReviewBestAccuracy }));
      get().clearSessionCheckpointsWithPrefix(`${pathKey}:`);
    },

    setActivePath: (pathKey) => {
      const state = get();
      if (state.activePathKey === pathKey) return;
      set(persist({ ...state, activePathKey: pathKey }));
    },
  };
}
