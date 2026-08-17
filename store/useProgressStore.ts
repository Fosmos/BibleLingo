import { create } from "zustand";
import type { PathProgress, UserProgress } from "@/types";
import { clearProgress, getDefaultProgress, loadProgress, saveProgress } from "@/lib/storage";
import { useAuthStore } from "@/store/useAuthStore";
import { daysSinceLastCompletion } from "@/lib/streak";
import { syncMemorizedEntities, createManualEntity, overlapsExistingEntity, entityId } from "@/lib/memorizedEntities";
import { scheduleReview, createSeedSRSState, type SrsPhase } from "@/lib/srs";
import { SHEKELS_PER_VERSE_REVIEWED } from "@/lib/economy";

export type StreakLoadStatus = "none" | "frozen" | "lost";

interface ProgressActions {
  hydrate: (userId: string) => void;
  incrementStreak: () => void;
  resetStreak: () => void;
  consumeStreakFreeze: () => boolean;
  addStreakFreeze: (amount: number) => void;
  evaluateStreakOnLoad: () => { status: StreakLoadStatus; previousStreak: number };
  setPath: (pathKey: string, version: string, versesPerDay?: number) => void;
  setActivePath: (pathKey: string) => void;
  completeDay: (pathKey: string, dayNumber: number) => void;
  awardSticker: (pathKey: string) => void;
  recordSrsReview: (entityId: string, passed: boolean, perfect: boolean) => void;
  earnShekels: (amount: number) => void;
  recordChapterReviewAccuracy: (pathKey: string, accuracy: number) => void;
  recordMasteryLevel: (key: string, level: number) => void;
  addManualMemorizedEntity: (
    book: string,
    chapter: number,
    startVerse: number,
    endVerse: number,
    phase: SrsPhase,
    version: string,
  ) => void;
  addManualMemorizedBook: (book: string, chapterVerseCounts: number[], phase: SrsPhase, version: string) => void;
  setIncludeVerseReferences: (value: boolean) => void;
  patchSessionCheckpoint: (sessionKey: string, field: string, value: number) => void;
  clearSessionCheckpoint: (sessionKey: string) => void;
  resetProgress: () => void;
}

type ProgressStore = UserProgress & ProgressActions;

// Reads the signed-in user id at save time rather than threading it through every action
// signature — every action already runs only while someone is signed in (the app gates all
// routes that touch this store behind AuthGate), so this is never expected to be null here.
function persist(progress: UserProgress): UserProgress {
  const userId = useAuthStore.getState().currentUserId;
  if (userId) saveProgress(userId, progress);
  return progress;
}

export const useProgressStore = create<ProgressStore>((set, get) => ({
  ...getDefaultProgress(),

  hydrate: (userId) => {
    set(loadProgress(userId));
  },

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

  setPath: (pathKey, version, versesPerDay) => {
    const state = get();
    const existing = state.paths[pathKey];
    const plan: PathProgress = {
      version,
      completedDays: existing?.completedDays ?? 0,
      versesPerDay: versesPerDay ?? existing?.versesPerDay,
    };
    set(persist({ ...state, paths: { ...state.paths, [pathKey]: plan } }));
  },

  setActivePath: (pathKey) => {
    const state = get();
    if (state.activePathKey === pathKey) return;
    set(persist({ ...state, activePathKey: pathKey }));
  },

  completeDay: (pathKey, dayNumber) => {
    const state = get();
    const existing = state.paths[pathKey];
    if (!existing) return;
    const completedDays = Math.max(existing.completedDays, dayNumber);
    const paths = { ...state.paths, [pathKey]: { ...existing, completedDays } };
    const memorizedEntities = syncMemorizedEntities(paths, state.memorizedEntities);
    set(persist({ ...state, paths, memorizedEntities }));
  },

  awardSticker: (pathKey) => {
    const state = get();
    if (state.stickers.includes(pathKey)) return;
    set(persist({ ...state, stickers: [...state.stickers, pathKey] }));
  },

  recordSrsReview: (entityId, passed, perfect) => {
    const state = get();
    const entity = state.memorizedEntities.find((candidate) => candidate.id === entityId);
    if (!entity) return;
    const srs = scheduleReview(entity.srs, passed);
    const memorizedEntities = state.memorizedEntities.map((candidate) =>
      candidate.id === entityId ? { ...candidate, srs } : candidate,
    );
    set(persist({ ...state, memorizedEntities }));
    // Only a review with zero mistakes earns shekels — a pass that needed retries still
    // schedules the next review normally, it just doesn't pay out.
    if (passed && perfect) {
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

  setIncludeVerseReferences: (value) => {
    const state = get();
    set(persist({ ...state, includeVerseReferences: value }));
  },

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

  resetProgress: () => {
    const userId = useAuthStore.getState().currentUserId;
    if (userId) clearProgress(userId);
    set(getDefaultProgress());
  },
}));
