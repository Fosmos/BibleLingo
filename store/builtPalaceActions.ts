import type { StoreApi } from "zustand";
import type { BuiltPalace, Palace3D, UserProgress } from "@/types";
import type { ProgressStore } from "@/store/useProgressStore";

export interface BuiltPalaceActions {
  // Adds the palace, or replaces the one with its id (every edit in the Palace tab saves the whole
  // palace — lib/builtPalaces.ts builds the edited copy).
  saveBuiltPalace: (palace: BuiltPalace) => void;
  deleteBuiltPalace: (id: string) => void;
  // The experimental 3D tab's palace for a path (lib/palace3d/palaceEdits.ts builds the edited copy).
  savePalace3D: (palace: Palace3D) => void;
}

// The built palaces (UserProgress.builtPalaces) — split out of useProgressStore.ts to keep
// that file under the 200-line cap; see store/streakActions.ts for why set/get/persist come in.
export function createBuiltPalaceActions(
  set: StoreApi<ProgressStore>["setState"],
  get: StoreApi<ProgressStore>["getState"],
  persist: (progress: UserProgress) => UserProgress,
): BuiltPalaceActions {
  return {
    saveBuiltPalace: (palace) => {
      const state = get();
      const existing = state.builtPalaces ?? [];
      const builtPalaces = existing.some((entry) => entry.id === palace.id) ? existing.map((entry) => (entry.id === palace.id ? palace : entry)) : [...existing, palace];
      set(persist({ ...state, builtPalaces }));
    },

    deleteBuiltPalace: (id) => {
      const state = get();
      set(persist({ ...state, builtPalaces: (state.builtPalaces ?? []).filter((palace) => palace.id !== id) }));
    },

    savePalace3D: (palace) => {
      const state = get();
      set(persist({ ...state, palaces3d: { ...state.palaces3d, [palace.pathKey]: palace } }));
    },
  };
}
