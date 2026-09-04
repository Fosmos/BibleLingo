import type { StoreApi } from "zustand";
import type { UserProgress } from "@/types";
import { verseKey } from "@/lib/verseKey";
import type { ProgressStore } from "@/store/useProgressStore";

interface ProblemVerseActions {
  flagProblemVerse: (book: string, chapter: number, verseNumber: number, version: string) => void;
  clearProblemVerse: (book: string, chapter: number, verseNumber: number) => void;
}

// Split out of useProgressStore.ts purely to keep that file under this codebase's 200-line
// cap — see store/streakActions.ts for why set/get/persist are passed in rather than imported.
export function createProblemVerseActions(
  set: StoreApi<ProgressStore>["setState"],
  get: StoreApi<ProgressStore>["getState"],
  persist: (progress: UserProgress) => UserProgress,
): ProblemVerseActions {
  return {
    // Adds (or refreshes the flaggedAt of) one verse in the Problem Verses bin — never removes
    // it from wherever else it already is (its SRS box, memorized entity, etc.), and staying
    // flagged here doesn't affect box promotion either; this is purely an additional,
    // standing "needs extra practice" list (see components/gamification/ProblemVersesBin.tsx).
    flagProblemVerse: (book, chapter, verseNumber, version) => {
      const state = get();
      const key = verseKey(book, chapter, verseNumber);
      set(
        persist({
          ...state,
          problemVerses: {
            ...state.problemVerses,
            [key]: { book, chapter, verseNumber, version, flaggedAt: new Date().toISOString() },
          },
        }),
      );
    },

    // Clears a verse back out of the bin — see ProblemVerseEntry's own doc comment for the
    // two callers: SrsReviewSession, once a later review scores PROMOTION_ACCURACY_THRESHOLD
    // or higher, and RelearnSession, once it finishes the full Learn flow for this verse.
    clearProblemVerse: (book, chapter, verseNumber) => {
      const state = get();
      const key = verseKey(book, chapter, verseNumber);
      if (!(key in state.problemVerses)) return;
      const problemVerses = { ...state.problemVerses };
      delete problemVerses[key];
      set(persist({ ...state, problemVerses }));
    },
  };
}
