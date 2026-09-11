import type { StoreApi } from "zustand";
import type { UserProgress } from "@/types";
import { scheduleReview } from "@/lib/srs";
import { SHEKELS_PER_VERSE_REVIEWED } from "@/lib/economy";
import type { ProgressStore } from "@/store/useProgressStore";

interface SrsReviewActions {
  recordSrsReview: (entityId: string, accuracy: number) => void;
  earnShekels: (amount: number) => void;
  recordChapterReviewAccuracy: (pathKey: string, accuracy: number) => void;
  recordMasteryLevel: (key: string, level: number) => void;
}

// Split out of useProgressStore.ts purely to keep that file under this codebase's 200-line
// cap — see store/streakActions.ts for why set/get/persist are passed in rather than imported.
export function createSrsReviewActions(
  set: StoreApi<ProgressStore>["setState"],
  get: StoreApi<ProgressStore>["getState"],
  persist: (progress: UserProgress) => UserProgress,
): SrsReviewActions {
  return {
    recordSrsReview: (entityId, accuracy) => {
      const state = get();
      const entity = state.memorizedEntities.find((candidate) => candidate.id === entityId);
      if (!entity) return;
      const srs = scheduleReview(entity.srs, accuracy, new Date(), state.srsPromotionThreshold, state.restDayOfWeek ?? null);
      const memorizedEntities = state.memorizedEntities.map((candidate) => (candidate.id === entityId ? { ...candidate, srs } : candidate));
      const best = Math.max(state.srsBestAccuracy[entityId] ?? 0, accuracy);
      set(persist({ ...state, memorizedEntities, srsBestAccuracy: { ...state.srsBestAccuracy, [entityId]: best } }));
      // Only a perfect (100%, zero-mistake) review earns shekels — a pass that still promotes
      // a box but needed retries along the way doesn't pay out.
      if (accuracy === 100) {
        const verseCount = entity.endVerse - entity.startVerse + 1;
        get().earnShekels(verseCount * SHEKELS_PER_VERSE_REVIEWED);
      }
    },

    earnShekels: (amount) => {
      const state = get();
      set(persist({ ...state, shekels: state.shekels + amount }));
    },

    recordChapterReviewAccuracy: (pathKey, accuracy) => {
      const state = get();
      const best = Math.max(state.chapterReviewBestAccuracy[pathKey] ?? 0, accuracy);
      set(persist({ ...state, chapterReviewBestAccuracy: { ...state.chapterReviewBestAccuracy, [pathKey]: best } }));
    },

    recordMasteryLevel: (key, level) => {
      const state = get();
      const best = Math.max(state.masteryLevels[key] ?? 0, level);
      set(persist({ ...state, masteryLevels: { ...state.masteryLevels, [key]: best } }));
    },
  };
}
