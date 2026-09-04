import type { StoreApi } from "zustand";
import type { UserProgress } from "@/types";
import { createManualEntity, overlapsExistingEntity, entityId } from "@/lib/memorizedEntities";
import { createSeedSRSState, type SrsPhase } from "@/lib/srs";
import type { ProgressStore } from "@/store/useProgressStore";

interface ManualEntityActions {
  addManualMemorizedEntity: (
    book: string,
    chapter: number,
    startVerse: number,
    endVerse: number,
    phase: SrsPhase,
    version: string,
  ) => void;
  addManualMemorizedBook: (book: string, chapterVerseCounts: number[], phase: SrsPhase, version: string) => void;
}

// Split out of useProgressStore.ts purely to keep that file under this codebase's 200-line
// cap — see store/streakActions.ts for why set/get/persist are passed in rather than imported.
export function createManualEntityActions(
  set: StoreApi<ProgressStore>["setState"],
  get: StoreApi<ProgressStore>["getState"],
  persist: (progress: UserProgress) => UserProgress,
): ManualEntityActions {
  return {
    addManualMemorizedEntity: (book, chapter, startVerse, endVerse, phase, version) => {
      const state = get();
      const entity = createManualEntity(book, chapter, startVerse, endVerse, createSeedSRSState(phase), version);
      set(persist({ ...state, memorizedEntities: [...state.memorizedEntities, entity] }));
      get().awardSticker(`manual:${entityId(book, chapter, startVerse, endVerse)}`);
    },

    addManualMemorizedBook: (book, chapterVerseCounts, phase, version) => {
      const state = get();
      // One entity per chapter (entities never span chapter boundaries — see
      // lib/memorizedEntities.ts) — chapters that overlap something already tracked (e.g. a
      // path-derived or previously manual entry) are skipped rather than duplicated.
      const newEntities = chapterVerseCounts.reduce<typeof state.memorizedEntities>((entities, verseCount, index) => {
        const chapter = index + 1;
        if (verseCount <= 0) return entities;
        if (overlapsExistingEntity([...state.memorizedEntities, ...entities], book, chapter, 1, verseCount)) return entities;
        return [...entities, createManualEntity(book, chapter, 1, verseCount, createSeedSRSState(phase), version)];
      }, []);
      if (newEntities.length === 0) return;
      set(persist({ ...state, memorizedEntities: [...state.memorizedEntities, ...newEntities] }));
      get().awardSticker(`manual-book:${book}`);
    },
  };
}
