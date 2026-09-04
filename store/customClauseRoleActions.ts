import type { StoreApi } from "zustand";
import type { CustomClauseRole, UserProgress } from "@/types";
import type { ProgressStore } from "@/store/useProgressStore";

interface CustomClauseRoleActions {
  upsertCustomClauseRole: (book: string, role: CustomClauseRole) => void;
}

// Split out of useProgressStore.ts purely to keep that file under this codebase's 200-line
// cap — see store/streakActions.ts for why set/get/persist are passed in rather than imported.
export function createCustomClauseRoleActions(
  set: StoreApi<ProgressStore>["setState"],
  get: StoreApi<ProgressStore>["getState"],
  persist: (progress: UserProgress) => UserProgress,
): CustomClauseRoleActions {
  return {
    // Adds a newly-defined role to this book's list, or replaces the matching one by id when
    // it's a rename/recolor of a role already used in this book (see CustomRoleEditor).
    upsertCustomClauseRole: (book, role) => {
      const state = get();
      const existing = state.customClauseRoles[book] ?? [];
      const roles = existing.some((candidate) => candidate.id === role.id)
        ? existing.map((candidate) => (candidate.id === role.id ? role : candidate))
        : [...existing, role];
      set(persist({ ...state, customClauseRoles: { ...state.customClauseRoles, [book]: roles } }));
    },
  };
}
