import type { StoreApi } from "zustand";
import type { UserProgress } from "@/types";
import type { ProgressStore } from "@/store/useProgressStore";

interface SessionCheckpointActions {
  patchSessionCheckpoint: (sessionKey: string, field: string, value: number) => void;
  clearSessionCheckpoint: (sessionKey: string) => void;
  clearSessionCheckpointsWithPrefix: (prefix: string) => void;
}

// Split out of useProgressStore.ts purely to keep that file under this codebase's 200-line
// cap — see store/streakActions.ts for why set/get/persist are passed in rather than imported.
export function createSessionCheckpointActions(
  set: StoreApi<ProgressStore>["setState"],
  get: StoreApi<ProgressStore>["getState"],
  persist: (progress: UserProgress) => UserProgress,
): SessionCheckpointActions {
  return {
    patchSessionCheckpoint: (sessionKey, field, value) => {
      const state = get();
      const existing = state.sessionCheckpoints[sessionKey] ?? {};
      set(
        persist({
          ...state,
          sessionCheckpoints: { ...state.sessionCheckpoints, [sessionKey]: { ...existing, [field]: value } },
        }),
      );
    },

    clearSessionCheckpoint: (sessionKey) => {
      const state = get();
      if (!(sessionKey in state.sessionCheckpoints)) return;
      const remaining = { ...state.sessionCheckpoints };
      delete remaining[sessionKey];
      set(persist({ ...state, sessionCheckpoints: remaining }));
    },

    // Clears `prefix` itself plus every "`prefix`:<suffix>" entry — for a session whose own
    // checkpoint is split across several sub-keys (e.g. SrsReviewSession's own
    // "srs:<entityId>:<stepIndex>" per pericope segment), a plain clearSessionCheckpoint(prefix)
    // above only ever clears the bare key, leaving each numbered step's own checkpoint behind.
    clearSessionCheckpointsWithPrefix: (prefix) => {
      const state = get();
      const remaining = { ...state.sessionCheckpoints };
      let changed = false;
      for (const key of Object.keys(remaining)) {
        if (key === prefix || key.startsWith(`${prefix}:`)) {
          delete remaining[key];
          changed = true;
        }
      }
      if (!changed) return;
      set(persist({ ...state, sessionCheckpoints: remaining }));
    },
  };
}
