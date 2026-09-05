import type { StoreApi } from "zustand";
import type { UserProgress } from "@/types";
import type { ProgressStore } from "@/store/useProgressStore";

interface LearnSettingsActions {
  setUnderstandStageEnabled: (value: boolean) => void;
  setVisualizeStageEnabled: (value: boolean) => void;
  setWriteFirstLetterStageEnabled: (value: boolean) => void;
  setFillInTheBlankStageEnabled: (value: boolean) => void;
}

// Split out of useProgressStore.ts purely to keep that file under this codebase's 200-line
// cap — see store/streakActions.ts for why set/get/persist are passed in rather than imported.
export function createLearnSettingsActions(
  set: StoreApi<ProgressStore>["setState"],
  get: StoreApi<ProgressStore>["getState"],
  persist: (progress: UserProgress) => UserProgress,
): LearnSettingsActions {
  return {
    setUnderstandStageEnabled: (value) => {
      const state = get();
      set(persist({ ...state, understandStageEnabled: value }));
    },

    setVisualizeStageEnabled: (value) => {
      const state = get();
      set(persist({ ...state, visualizeStageEnabled: value }));
    },

    setWriteFirstLetterStageEnabled: (value) => {
      const state = get();
      set(persist({ ...state, writeFirstLetterStageEnabled: value }));
    },

    setFillInTheBlankStageEnabled: (value) => {
      const state = get();
      set(persist({ ...state, fillInTheBlankStageEnabled: value }));
    },
  };
}
