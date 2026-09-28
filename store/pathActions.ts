import type { StoreApi } from "zustand";
import type { PathProgress, UserProgress } from "@/types";
import type { ProgressStore } from "@/store/useProgressStore";
import { activePathKeysOf } from "@/lib/activePaths";
import { syncMemorizedEntities } from "@/lib/memorizedEntities";

interface PathActions {
  setPath: (
    pathKey: string,
    version: string,
    versesPerDay?: number,
    priorKnownVerseCount?: number,
    // How many auto-completed days that verse count actually becomes (see lib/dayPlan.ts's own
    // priorKnownDayCount) — the caller (PathOverviewScreen.tsx) computes this against the
    // path's real verses, since this store action has no verse data of its own to derive it
    // from.
    priorKnownDayCount?: number,
  ) => void;
  resetPathProgress: (pathKey: string) => void;
  // Focuses `pathKey`, adding it to the active set if it isn't there yet.
  setActivePath: (pathKey: string) => void;
  // Stops working through `pathKey` (its progress is kept). If it was the focused path, focus
  // moves to another active path, or to none.
  removeActivePath: (pathKey: string) => void;
  // A path found already finished (every verse learned) that's still listed as active — one
  // completed before finished paths retired themselves: drops it, and makes sure its verses are in
  // spaced review.
  retireLearnedPath: (pathKey: string) => void;
}

// Split out of useProgressStore.ts purely to keep that file under this codebase's 200-line
// cap — see store/streakActions.ts for why set/get/persist are passed in rather than imported.
export function createPathActions(
  set: StoreApi<ProgressStore>["setState"],
  get: StoreApi<ProgressStore>["getState"],
  persist: (progress: UserProgress) => UserProgress,
): PathActions {
  return {
    setPath: (pathKey, version, versesPerDay, priorKnownVerseCount, priorKnownDays) => {
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
        priorKnownVerseCount: freshPriorKnownVerseCount,
      };
      const paths = { ...state.paths, [pathKey]: plan };
      // A path that starts with days already done — the "I already know some of this" step
      // when choosing it (on the Mind Map or anywhere else) — has verses that are memorized from
      // the moment it exists, so they go into spaced review (SRS) right away, the same rebuild
      // completeDay runs, rather than waiting for the reader's first real lesson on it.
      const gainedDays = plan.completedDays > (existing?.completedDays ?? 0);
      const memorizedEntities = gainedDays ? syncMemorizedEntities(paths, state.memorizedEntities) : state.memorizedEntities;
      set(persist({ ...state, paths, memorizedEntities }));
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
      const keys = activePathKeysOf(state);
      if (state.activePathKey === pathKey && state.activePathKeys?.includes(pathKey)) return;
      const activePathKeys = keys.includes(pathKey) ? keys : [...keys, pathKey];
      set(persist({ ...state, activePathKey: pathKey, activePathKeys }));
    },

    retireLearnedPath: (pathKey) => {
      get().removeActivePath(pathKey);
      const state = get();
      set(persist({ ...state, memorizedEntities: syncMemorizedEntities(state.paths, state.memorizedEntities) }));
    },

    removeActivePath: (pathKey) => {
      const state = get();
      const activePathKeys = activePathKeysOf(state).filter((key) => key !== pathKey);
      const activePathKey = state.activePathKey === pathKey ? (activePathKeys[0] ?? null) : state.activePathKey;
      set(persist({ ...state, activePathKey, activePathKeys }));
    },
  };
}
