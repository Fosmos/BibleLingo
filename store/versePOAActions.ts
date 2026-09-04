import type { StoreApi } from "zustand";
import type { UserProgress, VersePOA } from "@/types";
import { verseKey } from "@/lib/verseKey";
import type { ProgressStore } from "@/store/useProgressStore";

interface VersePOAActions {
  setVersePOA: (book: string, chapter: number, verseNumber: number, poa: VersePOA) => void;
}

// Split out of useProgressStore.ts purely to keep that file under this codebase's 200-line
// cap — see store/streakActions.ts for why set/get/persist are passed in rather than imported.
export function createVersePOAActions(
  set: StoreApi<ProgressStore>["setState"],
  get: StoreApi<ProgressStore>["getState"],
  persist: (progress: UserProgress) => UserProgress,
): VersePOAActions {
  return {
    setVersePOA: (book, chapter, verseNumber, poa) => {
      const state = get();
      const key = verseKey(book, chapter, verseNumber);
      set(persist({ ...state, versePOA: { ...state.versePOA, [key]: poa } }));
    },
  };
}
