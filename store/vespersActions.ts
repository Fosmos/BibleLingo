import type { StoreApi } from "zustand";
import type { UserProgress } from "@/types";
import { todayDateKey } from "@/lib/dateKey";
import type { ProgressStore } from "@/store/useProgressStore";

interface VespersActions {
  setVespersHour: (hour: number | null) => void;
  dismissVespersPromptToday: () => void;
}

// Split out of useProgressStore.ts purely to keep that file under this codebase's 200-line
// cap — see store/streakActions.ts for why set/get/persist are passed in rather than imported.
export function createVespersActions(
  set: StoreApi<ProgressStore>["setState"],
  get: StoreApi<ProgressStore>["getState"],
  persist: (progress: UserProgress) => UserProgress,
): VespersActions {
  return {
    // Same undefined/null-means-off convention as UserProgress.restDayOfWeek — hour is the
    // reader's own local 0-23 wind-down hour, or null to turn the evening prompt off entirely.
    setVespersHour: (hour) => {
      const state = get();
      set(persist({ ...state, vespersHour: hour }));
    },

    // Lets VespersPromptCard.tsx stop re-offering for the rest of today once the reader taps
    // "Not tonight" — same todayDateKey() convention markBuildingViewReviewedToday already
    // uses, so it self-clears the next calendar day with no timer/cleanup needed.
    dismissVespersPromptToday: () => {
      const state = get();
      set(persist({ ...state, vespersPromptDismissedDate: todayDateKey() }));
    },
  };
}
