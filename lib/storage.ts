import type { UserProgress } from "@/types";
import { PROMOTION_ACCURACY_THRESHOLD } from "@/lib/srs";

const STORAGE_PREFIX = "verses:progress:";
const SCHEMA_VERSION = 30;

function progressKey(userId: string): string {
  return `${STORAGE_PREFIX}${userId}`;
}

export function getDefaultProgress(): UserProgress {
  return {
    schemaVersion: SCHEMA_VERSION,
    streak: {
      currentStreak: 0,
      longestStreak: 0,
      lastCompletedAt: null,
      freeze: { inventory: 0 },
    },
    paths: {},
    stickers: [],
    activePathKey: null,
    memorizedEntities: [],
    shekels: 0,
    includeVerseReferences: false,
    buildingViewEnabled: false,
    versePOA: {},
    locationTags: {},
    iconTags: {},
    pegMasterList: {},
    pegSystemEnabled: false,
    buildingViewLastReviewDate: null,
    chapterReviewBestAccuracy: {},
    srsBestAccuracy: {},
    sessionCheckpoints: {},
    masteryLevels: {},
    customClauseRoles: {},
    srsSpeakModeEnabled: false,
    srsPromotionThreshold: PROMOTION_ACCURACY_THRESHOLD,
    problemVerses: {},
    wordStumbleCounts: {},
    understandStageEnabled: true,
    visualizeStageEnabled: true,
    writeFirstLetterStageEnabled: true,
    fillInTheBlankStageEnabled: true,
    rhythmStageEnabled: false,
    kineticTextStageEnabled: true,
    restDayOfWeek: null,
    vespersHour: null,
    vespersPromptDismissedDate: null,
  };
}

function parseStoredProgress(raw: string): UserProgress | null {
  try {
    const parsed = JSON.parse(raw) as UserProgress;
    if (parsed.schemaVersion !== SCHEMA_VERSION) {
      console.warn(
        `[storage] Ignoring saved progress: schema v${parsed.schemaVersion} does not match current v${SCHEMA_VERSION}. Resetting to defaults.`,
      );
      return null;
    }
    return parsed;
  } catch (error) {
    console.warn("[storage] Failed to parse saved progress, resetting to defaults.", error);
    return null;
  }
}

export function loadProgress(userId: string): UserProgress {
  if (typeof window === "undefined") {
    return getDefaultProgress();
  }
  const raw = window.localStorage.getItem(progressKey(userId));
  if (!raw) {
    return getDefaultProgress();
  }
  return parseStoredProgress(raw) ?? getDefaultProgress();
}

export function saveProgress(userId: string, progress: UserProgress): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(progressKey(userId), JSON.stringify(progress));
}

export function clearProgress(userId: string): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(progressKey(userId));
}
