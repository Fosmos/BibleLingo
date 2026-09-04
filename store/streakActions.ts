import type { StoreApi } from "zustand";
import type { UserProgress } from "@/types";
import { daysSinceLastCompletion } from "@/lib/streak";
import type { ProgressStore } from "@/store/useProgressStore";

export type StreakLoadStatus = "none" | "frozen" | "lost";

interface StreakActions {
  incrementStreak: () => void;
  resetStreak: () => void;
  consumeStreakFreeze: () => boolean;
  addStreakFreeze: (amount: number) => void;
  evaluateStreakOnLoad: () => { status: StreakLoadStatus; previousStreak: number };
}

// Split out of useProgressStore.ts purely to keep that file under this codebase's 200-line
// cap — set/get/persist are passed in rather than imported, so this stays a plain function
// with no runtime dependency back on the store module (only the type-only ProgressStore
// import above, erased at compile time).
export function createStreakActions(
  set: StoreApi<ProgressStore>["setState"],
  get: StoreApi<ProgressStore>["getState"],
  persist: (progress: UserProgress) => UserProgress,
): StreakActions {
  return {
    incrementStreak: () => {
      const state = get();
      const now = new Date();
      const alreadyCompletedToday =
        state.streak.lastCompletedAt !== null && daysSinceLastCompletion(state.streak.lastCompletedAt, now) === 0;
      if (alreadyCompletedToday) return;

      const currentStreak = state.streak.currentStreak + 1;
      const streak = {
        ...state.streak,
        currentStreak,
        longestStreak: Math.max(state.streak.longestStreak, currentStreak),
        lastCompletedAt: now.toISOString(),
      };
      set(persist({ ...state, streak }));
    },

    resetStreak: () => {
      const state = get();
      set(persist({ ...state, streak: { ...state.streak, currentStreak: 0 } }));
    },

    consumeStreakFreeze: () => {
      const state = get();
      if (state.streak.freeze.inventory <= 0) return false;
      const streak = { ...state.streak, freeze: { inventory: state.streak.freeze.inventory - 1 } };
      set(persist({ ...state, streak }));
      return true;
    },

    addStreakFreeze: (amount) => {
      const state = get();
      const streak = { ...state.streak, freeze: { inventory: state.streak.freeze.inventory + amount } };
      set(persist({ ...state, streak }));
    },

    evaluateStreakOnLoad: () => {
      const state = get();
      const previousStreak = state.streak.currentStreak;
      const gapDays = daysSinceLastCompletion(state.streak.lastCompletedAt, new Date());

      if (previousStreak === 0 || gapDays <= 1) {
        return { status: "none" as const, previousStreak };
      }
      if (gapDays === 2 && state.streak.freeze.inventory > 0) {
        get().consumeStreakFreeze();
        return { status: "frozen" as const, previousStreak };
      }
      get().resetStreak();
      return { status: "lost" as const, previousStreak };
    },
  };
}
