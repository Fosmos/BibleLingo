import type { StoreApi } from "zustand";
import type { UserProgress, VerseSegment } from "@/types";
import { recordStumbles } from "@/lib/stumbleTracking";
import type { ProgressStore } from "@/store/useProgressStore";

interface StumbleTrackingActions {
  recordWordStumbles: (verse: VerseSegment, wrongIndices: number[]) => void;
}

// Split out of useProgressStore.ts purely to keep that file under this codebase's 200-line
// cap — see store/streakActions.ts for why set/get/persist are passed in rather than imported.
export function createStumbleTrackingActions(
  set: StoreApi<ProgressStore>["setState"],
  get: StoreApi<ProgressStore>["getState"],
  persist: (progress: UserProgress) => UserProgress,
): StumbleTrackingActions {
  return {
    recordWordStumbles: (verse, wrongIndices) => {
      if (wrongIndices.length === 0) return;
      const state = get();
      set(persist({ ...state, wordStumbleCounts: recordStumbles(state.wordStumbleCounts, verse, wrongIndices) }));
    },
  };
}
