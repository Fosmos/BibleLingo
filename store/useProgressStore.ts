import { create } from "zustand";
import type { CustomClauseRole, LocationTagLevel, PathProgress, UserProgress, VersePOA, VerseSegment } from "@/types";
import { clearProgress, getDefaultProgress, loadProgress, saveProgress } from "@/lib/storage";
import { syncProgressToServer } from "@/lib/accountApiClient";
import { useAuthStore } from "@/store/useAuthStore";
import { LOCAL_USER_ID } from "@/lib/authConfig";
import { syncMemorizedEntities, addChapterVersesToEntities } from "@/lib/memorizedEntities";
import { scheduleReview, type SrsPhase } from "@/lib/srs";
import { SHEKELS_PER_VERSE_REVIEWED } from "@/lib/economy";
import { createStreakActions, type StreakLoadStatus } from "@/store/streakActions";
import { createManualEntityActions } from "@/store/manualEntityActions";
import { createBuildingViewActions } from "@/store/buildingViewActions";
import { createVersePOAActions } from "@/store/versePOAActions";
import { createLocationTagActions } from "@/store/locationTagActions";
import { createCustomClauseRoleActions } from "@/store/customClauseRoleActions";
import { createSessionCheckpointActions } from "@/store/sessionCheckpointActions";
import { createProblemVerseActions } from "@/store/problemVerseActions";
import { createReviewSettingsActions } from "@/store/reviewSettingsActions";
import { createLearnSettingsActions } from "@/store/learnSettingsActions";

export type { StreakLoadStatus };

interface ProgressActions {
  hydrate: (userId: string) => void;
  incrementStreak: () => void;
  resetStreak: () => void;
  consumeStreakFreeze: () => boolean;
  addStreakFreeze: (amount: number) => void;
  evaluateStreakOnLoad: () => { status: StreakLoadStatus; previousStreak: number };
  setPath: (pathKey: string, version: string, versesPerDay?: number, locationTagLevels?: LocationTagLevel[]) => void;
  setActivePath: (pathKey: string) => void;
  completeDay: (pathKey: string, dayNumber: number) => void;
  completeBookChapter: (chapterVerses: VerseSegment[], version: string) => void;
  awardSticker: (pathKey: string) => void;
  recordSrsReview: (entityId: string, accuracy: number) => void;
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
  setBuildingViewEnabled: (value: boolean) => void;
  setVersePOA: (book: string, chapter: number, verseNumber: number, poa: VersePOA) => void;
  setPegSystemEnabled: (value: boolean) => void;
  markBuildingViewReviewedToday: () => void;
  setLocationTag: (key: string, value: string) => void;
  clearLocationTag: (key: string) => void;
  upsertCustomClauseRole: (book: string, role: CustomClauseRole) => void;
  patchSessionCheckpoint: (sessionKey: string, field: string, value: number) => void;
  clearSessionCheckpoint: (sessionKey: string) => void;
  clearSessionCheckpointsWithPrefix: (prefix: string) => void;
  flagProblemVerse: (book: string, chapter: number, verseNumber: number, version: string) => void;
  clearProblemVerse: (book: string, chapter: number, verseNumber: number) => void;
  setPericopeHeadingRecallEnabled: (value: boolean) => void;
  setUnderstandStageEnabled: (value: boolean) => void;
  setVisualizeStageEnabled: (value: boolean) => void;
  setWriteFirstLetterStageEnabled: (value: boolean) => void;
  resetProgress: () => void;
}

export type ProgressStore = UserProgress & ProgressActions;

// Reads the signed-in user id at save time rather than threading it through every action —
// every action runs only while signed in (AuthGate gates every route), so never null here.
// Every write also fires a best-effort sync to the server (see lib/serverStore.ts) for real
// accounts — never for LOCAL_USER_ID, which every device/origin shares the same constant id
// for, so syncing it would let different devices stomp on each other's "local" progress.
function persist(progress: UserProgress): UserProgress {
  const userId = useAuthStore.getState().currentUserId;
  if (userId) {
    saveProgress(userId, progress);
    if (userId !== LOCAL_USER_ID) syncProgressToServer(userId, progress);
  }
  return progress;
}

export const useProgressStore = create<ProgressStore>((set, get) => ({
  ...getDefaultProgress(),
  ...createStreakActions(set, get, persist),
  ...createManualEntityActions(set, get, persist),
  ...createBuildingViewActions(set, get, persist),
  ...createVersePOAActions(set, get, persist),
  ...createLocationTagActions(set, get, persist),
  ...createCustomClauseRoleActions(set, get, persist),
  ...createSessionCheckpointActions(set, get, persist),
  ...createProblemVerseActions(set, get, persist),
  ...createReviewSettingsActions(set, get, persist),
  ...createLearnSettingsActions(set, get, persist),

  hydrate: (userId) => {
    set(loadProgress(userId));
  },

  setPath: (pathKey, version, versesPerDay, locationTagLevels) => {
    const state = get();
    const existing = state.paths[pathKey];
    const plan: PathProgress = {
      version,
      completedDays: existing?.completedDays ?? 0,
      versesPerDay: versesPerDay ?? existing?.versesPerDay,
      locationTagLevels: locationTagLevels ?? existing?.locationTagLevels,
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

  // Book mode's direct per-chapter graduation into SRS — called alongside completeDay, right
  // when a chapter's last learn day finishes. Independent of completeDay's
  // syncMemorizedEntities call above, which re-resolves the whole path from the local
  // chapter cache — unreliable for a whole book once the ESV storage cap evicts chapters.
  completeBookChapter: (chapterVerses, version) => {
    const state = get();
    const memorizedEntities = addChapterVersesToEntities(state.memorizedEntities, chapterVerses, version);
    set(persist({ ...state, memorizedEntities }));
  },

  awardSticker: (pathKey) => {
    const state = get();
    if (state.stickers.includes(pathKey)) return;
    set(persist({ ...state, stickers: [...state.stickers, pathKey] }));
  },

  recordSrsReview: (entityId, accuracy) => {
    const state = get();
    const entity = state.memorizedEntities.find((candidate) => candidate.id === entityId);
    if (!entity) return;
    const srs = scheduleReview(entity.srs, accuracy);
    const memorizedEntities = state.memorizedEntities.map((candidate) =>
      candidate.id === entityId ? { ...candidate, srs } : candidate,
    );
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

  setIncludeVerseReferences: (value) => {
    const state = get();
    set(persist({ ...state, includeVerseReferences: value }));
  },

  resetProgress: () => {
    const userId = useAuthStore.getState().currentUserId;
    const defaults = getDefaultProgress();
    if (userId) {
      clearProgress(userId);
      if (userId !== LOCAL_USER_ID) syncProgressToServer(userId, defaults);
    }
    set(defaults);
  },
}));
