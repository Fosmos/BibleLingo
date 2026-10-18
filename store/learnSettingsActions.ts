import type { StoreApi } from "zustand";
import type { UserProgress } from "@/types";
import type { ProgressStore } from "@/store/useProgressStore";

export interface LearnSettingsActions {
  setUnderstandStageEnabled: (value: boolean) => void;
  setVisualizeStageEnabled: (value: boolean) => void;
  setWriteFirstLetterStageEnabled: (value: boolean) => void;
  setRhythmStageEnabled: (value: boolean) => void;
  setWholeVerseLearning: (value: boolean) => void;
  setPrayStageEnabled: (value: boolean) => void;
  setLastLettersStageEnabled: (value: boolean) => void;
  setTimedTypeStageEnabled: (value: boolean) => void;
  setPayloadStageEnabled: (value: boolean) => void;
  setMathBreakStageEnabled: (value: boolean) => void;
  setPreviousLineShown: (value: boolean) => void;
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

    setRhythmStageEnabled: (value) => {
      const state = get();
      set(persist({ ...state, rhythmStageEnabled: value }));
    },

    setWholeVerseLearning: (value) => {
      const state = get();
      set(persist({ ...state, wholeVerseLearning: value }));
    },

    setPrayStageEnabled: (value) => set(persist({ ...get(), prayStageEnabled: value })),

    setLastLettersStageEnabled: (value) => {
      const state = get();
      set(persist({ ...state, lastLettersStageEnabled: value }));
    },

    setTimedTypeStageEnabled: (value) => set(persist({ ...get(), timedTypeStageEnabled: value })),
    setPayloadStageEnabled: (value) => set(persist({ ...get(), payloadStageEnabled: value })),
    setMathBreakStageEnabled: (value) => set(persist({ ...get(), mathBreakStageEnabled: value })),
    setPreviousLineShown: (value) => set(persist({ ...get(), previousLineShown: value })),
  };
}
