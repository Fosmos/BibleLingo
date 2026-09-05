import type { StoreApi } from "zustand";
import type { UserProgress } from "@/types";
import type { ProgressStore } from "@/store/useProgressStore";

interface ReviewSettingsActions {
  setPericopeHeadingRecallEnabled: (value: boolean) => void;
  setSrsPromotionThreshold: (value: number) => void;
  setProblemVerseThreshold: (value: number) => void;
}

function clampPercent(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

// Split out of useProgressStore.ts purely to keep that file under this codebase's 200-line
// cap — see store/streakActions.ts for why set/get/persist are passed in rather than imported.
export function createReviewSettingsActions(
  set: StoreApi<ProgressStore>["setState"],
  get: StoreApi<ProgressStore>["getState"],
  persist: (progress: UserProgress) => UserProgress,
): ReviewSettingsActions {
  return {
    setPericopeHeadingRecallEnabled: (value) => {
      const state = get();
      set(persist({ ...state, pericopeHeadingRecallEnabled: value }));
    },
    setSrsPromotionThreshold: (value) => {
      const state = get();
      set(persist({ ...state, srsPromotionThreshold: clampPercent(value) }));
    },
    setProblemVerseThreshold: (value) => {
      const state = get();
      set(persist({ ...state, problemVerseThreshold: clampPercent(value) }));
    },
  };
}
