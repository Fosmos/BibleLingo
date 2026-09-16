import { create } from "zustand";
import type { CustomClauseRole, LocationTagLevel, UserProgress, VersePOA, VerseSegment } from "@/types";
import { clearProgress, getDefaultProgress, loadProgress, saveProgress } from "@/lib/storage";
import { syncProgressToServer } from "@/lib/accountApiClient";
import { useAuthStore } from "@/store/useAuthStore";
import { LOCAL_USER_ID } from "@/lib/authConfig";
import { syncMemorizedEntities, addChapterVersesToEntities } from "@/lib/memorizedEntities";
import type { SrsPhase } from "@/lib/srs";
import { createStreakActions, type StreakLoadStatus } from "@/store/streakActions";
import { createSrsReviewActions } from "@/store/srsReviewActions";
import { createManualEntityActions } from "@/store/manualEntityActions";
import { createBuildingViewActions } from "@/store/buildingViewActions";
import { createVersePOAActions } from "@/store/versePOAActions";
import { createLocationTagActions } from "@/store/locationTagActions";
import { createPegMasterListActions } from "@/store/pegMasterListActions";
import { createCustomClauseRoleActions } from "@/store/customClauseRoleActions";
import { createSessionCheckpointActions } from "@/store/sessionCheckpointActions";
import { createProblemVerseActions } from "@/store/problemVerseActions";
import { createReviewSettingsActions } from "@/store/reviewSettingsActions";
import { createLearnSettingsActions } from "@/store/learnSettingsActions";
import { createPathActions } from "@/store/pathActions";
import { createStumbleTrackingActions } from "@/store/stumbleTrackingActions";
import { createVespersActions } from "@/store/vespersActions";

export type { StreakLoadStatus };

interface ProgressActions {
  hydrate: (userId: string) => void;
  incrementStreak: () => void;
  resetStreak: () => void;
  consumeStreakFreeze: () => boolean;
  addStreakFreeze: (amount: number) => void;
  evaluateStreakOnLoad: () => { status: StreakLoadStatus; previousStreak: number };
  setPath: (
    pathKey: string,
    version: string,
    versesPerDay?: number,
    locationTagLevels?: LocationTagLevel[],
    sectionEndPegEnabled?: boolean,
    priorKnownVerseCount?: number,
    priorKnownDayCount?: number,
  ) => void;
  resetPathProgress: (pathKey: string) => void;
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
  setIconTag: (key: string, iconId: string) => void;
  clearIconTag: (key: string) => void;
  recordWordStumbles: (verse: VerseSegment, wrongIndices: number[]) => void;
  setVespersHour: (hour: number | null) => void;
  dismissVespersPromptToday: () => void;
  setPegMasterWord: (key: string, value: string) => void;
  clearPegMasterWord: (key: string) => void;
  upsertCustomClauseRole: (book: string, role: CustomClauseRole) => void;
  patchSessionCheckpoint: (sessionKey: string, field: string, value: number) => void;
  clearSessionCheckpoint: (sessionKey: string) => void;
  clearSessionCheckpointsWithPrefix: (prefix: string) => void;
  flagProblemVerse: (book: string, chapter: number, verseNumber: number, version: string) => void;
  clearProblemVerse: (book: string, chapter: number, verseNumber: number) => void;
  setSrsSpeakModeEnabled: (value: boolean) => void;
  setSrsPromotionThreshold: (value: number) => void;
  setRestDayOfWeek: (value: number | null) => void;
  setUnderstandStageEnabled: (value: boolean) => void;
  setVisualizeStageEnabled: (value: boolean) => void;
  setWriteFirstLetterStageEnabled: (value: boolean) => void;
  setFillInTheBlankStageEnabled: (value: boolean) => void;
  setRhythmStageEnabled: (value: boolean) => void;
  setKineticTextStageEnabled: (value: boolean) => void;
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
  ...createPegMasterListActions(set, get, persist),
  ...createCustomClauseRoleActions(set, get, persist),
  ...createSessionCheckpointActions(set, get, persist),
  ...createProblemVerseActions(set, get, persist),
  ...createReviewSettingsActions(set, get, persist),
  ...createLearnSettingsActions(set, get, persist),
  ...createPathActions(set, get, persist),
  ...createStumbleTrackingActions(set, get, persist),
  ...createVespersActions(set, get, persist),
  ...createSrsReviewActions(set, get, persist),

  hydrate: (userId) => {
    set(loadProgress(userId));
  },

  completeDay: (pathKey, dayNumber) => {
    const state = get();
    const existing = state.paths[pathKey];
    if (!existing) return;
    const completedDays = Math.max(existing.completedDays, dayNumber);
    // Stamped every time, not just on a real advance — see PathProgress.lastCompletedAt and
    // lib/dayRollover.ts: this is what keeps tomorrow's lesson from revealing itself as
    // "today's" the instant this one finishes, rather than only once an actual midnight passes.
    const paths = { ...state.paths, [pathKey]: { ...existing, completedDays, lastCompletedAt: new Date().toISOString() } };
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
