import type { StoreApi } from "zustand";
import type { UserProgress } from "@/types";
import { todayDateKey } from "@/lib/dateKey";
import type { ProgressStore } from "@/store/useProgressStore";

interface BuildingViewActions {
  setPegSystemEnabled: (value: boolean) => void;
  markBuildingViewReviewedToday: () => void;
  setBuildingViewEnabled: (value: boolean) => void;
}

// Split out of useProgressStore.ts purely to keep that file under this codebase's 200-line
// cap — see store/streakActions.ts for why set/get/persist are passed in rather than imported.
export function createBuildingViewActions(
  set: StoreApi<ProgressStore>["setState"],
  get: StoreApi<ProgressStore>["getState"],
  persist: (progress: UserProgress) => UserProgress,
): BuildingViewActions {
  return {
    setPegSystemEnabled: (value) => {
      const state = get();
      set(persist({ ...state, pegSystemEnabled: value }));
    },

    markBuildingViewReviewedToday: () => {
      const state = get();
      set(persist({ ...state, buildingViewLastReviewDate: todayDateKey() }));
    },

    setBuildingViewEnabled: (value) => {
      const state = get();
      set(persist({ ...state, buildingViewEnabled: value }));
    },
  };
}
