import type { StoreApi } from "zustand";
import type { UserProgress } from "@/types";
import type { ProgressStore } from "@/store/useProgressStore";

interface RankActions {
  markRankCelebrated: (index: number) => void;
}

// Split out of useProgressStore.ts purely to keep that file under this codebase's 200-line cap —
// see store/streakActions.ts for why set/get/persist are passed in rather than imported.
export function createRankActions(
  set: StoreApi<ProgressStore>["setState"],
  get: StoreApi<ProgressStore>["getState"],
  persist: (progress: UserProgress) => UserProgress,
): RankActions {
  return {
    // Only ever moves up — a rank once celebrated is never celebrated again (RankUpWatcher.tsx).
    markRankCelebrated: (index) => {
      const state = get();
      if ((state.rankCelebrated ?? -1) >= index) return;
      set(persist({ ...state, rankCelebrated: index }));
    },
  };
}
