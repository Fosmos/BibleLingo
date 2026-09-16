import type { StoreApi } from "zustand";
import type { UserProgress } from "@/types";
import type { ProgressStore } from "@/store/useProgressStore";

interface LocationTagActions {
  setLocationTag: (key: string, value: string) => void;
  clearLocationTag: (key: string) => void;
  setIconTag: (key: string, iconId: string) => void;
  clearIconTag: (key: string) => void;
}

// Split out of useProgressStore.ts purely to keep that file under this codebase's 200-line
// cap — see store/streakActions.ts for why set/get/persist are passed in rather than imported.
export function createLocationTagActions(
  set: StoreApi<ProgressStore>["setState"],
  get: StoreApi<ProgressStore>["getState"],
  persist: (progress: UserProgress) => UserProgress,
): LocationTagActions {
  return {
    // Sets (or overwrites) one scope's free-text location tag — see lib/locationTags.ts's
    // locationTagKey. No suggestions, no validation: whatever the reader typed is saved as-is.
    setLocationTag: (key, value) => {
      const state = get();
      set(persist({ ...state, locationTags: { ...state.locationTags, [key]: value } }));
    },

    // Removes a scope's tag entirely, back to showing "add location tag".
    clearLocationTag: (key) => {
      const state = get();
      if (!(key in state.locationTags)) return;
      const locationTags = { ...state.locationTags };
      delete locationTags[key];
      set(persist({ ...state, locationTags }));
    },

    // Same key scheme as locationTags above (lib/locationTags.ts's locationTagKey) but its
    // own separate map — a verse can carry a free-text location tag AND an icon tag at once,
    // see components/gamification/IconTagField.tsx.
    setIconTag: (key, iconId) => {
      const state = get();
      set(persist({ ...state, iconTags: { ...state.iconTags, [key]: iconId } }));
    },

    clearIconTag: (key) => {
      const state = get();
      if (!(key in state.iconTags)) return;
      const iconTags = { ...state.iconTags };
      delete iconTags[key];
      set(persist({ ...state, iconTags }));
    },
  };
}
