import type { StoreApi } from "zustand";
import type { UserProgress } from "@/types";
import type { ProgressStore } from "@/store/useProgressStore";

interface ReviewSettingsActions {
  setSrsSpeakModeEnabled: (value: boolean) => void;
  setSrsPromotionThreshold: (value: number) => void;
  setRestDayOfWeek: (value: number | null) => void;
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
    setSrsSpeakModeEnabled: (value) => {
      const state = get();
      set(persist({ ...state, srsSpeakModeEnabled: value }));
    },
    setSrsPromotionThreshold: (value) => {
      const state = get();
      set(persist({ ...state, srsPromotionThreshold: clampPercent(value) }));
    },
    setRestDayOfWeek: (value) => {
      const state = get();
      set(persist({ ...state, restDayOfWeek: value }));
    },
  };
}
