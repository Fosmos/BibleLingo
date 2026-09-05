import type { StoreApi } from "zustand";
import type { UserProgress } from "@/types";
import type { ProgressStore } from "@/store/useProgressStore";

interface PegMasterListActions {
  setPegMasterWord: (key: string, value: string) => void;
  clearPegMasterWord: (key: string) => void;
}

// Split out of useProgressStore.ts purely to keep that file under this codebase's 200-line
// cap — see store/streakActions.ts for why set/get/persist are passed in rather than imported.
// One flat map keyed by lib/pegSystem.ts's pegMasterListKey (a number, not a scope — see
// types/index.ts's UserProgress.pegMasterList) — both the Master Peg List settings page and
// every PegTagField.tsx chip in a path view read/write through these same two actions.
export function createPegMasterListActions(
  set: StoreApi<ProgressStore>["setState"],
  get: StoreApi<ProgressStore>["getState"],
  persist: (progress: UserProgress) => UserProgress,
): PegMasterListActions {
  return {
    // Sets (or overwrites) one number's chosen peg word. No validation: whatever the reader
    // typed is saved as-is, same convention as setLocationTag.
    setPegMasterWord: (key, value) => {
      const state = get();
      set(persist({ ...state, pegMasterList: { ...state.pegMasterList, [key]: value } }));
    },

    // Removes a number's override, back to lib/pegSystem.ts's own recommendation.
    clearPegMasterWord: (key) => {
      const state = get();
      if (!(key in state.pegMasterList)) return;
      const pegMasterList = { ...state.pegMasterList };
      delete pegMasterList[key];
      set(persist({ ...state, pegMasterList }));
    },
  };
}
