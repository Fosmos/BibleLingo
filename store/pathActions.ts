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
    setPath: (pathKey, version, versesPerDay, locationTagLevels, sectionEndPegEnabled) => {
      const state = get();
      const existing = state.paths[pathKey];
      const plan: PathProgress = {
        version,
        completedDays: existing?.completedDays ?? 0,
        versesPerDay: versesPerDay ?? existing?.versesPerDay,
        locationTagLevels: locationTagLevels ?? existing?.locationTagLevels,
        sectionEndPegEnabled: sectionEndPegEnabled ?? existing?.sectionEndPegEnabled,
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
