import type { StoreApi } from "zustand";
import type { UserProgress } from "@/types";
import type { ProgressStore } from "@/store/useProgressStore";

interface ReviewSettingsActions {
  setPericopeHeadingRecallEnabled: (value: boolean) => void;
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
  };
}
