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
    celebratedMindMapChapters: [],
    celebratedMindMapBooks: [],
    activePathKey: null,
    activePathKeys: [],
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
  const parsed = parseStoredProgress(raw);
  if (!parsed) return getDefaultProgress();
  // Backfill onto the defaults rather than returning the parsed blob as-is — a schema-matched
  // blob saved before a new top-level field existed (see celebratedMindMapBooks's own doc
  // comment in types/index.ts) is otherwise missing that key entirely, not just holding an old
  // value for it, and a consumer that shallow-merges this straight into a store (see
  // store/useProgressStore.ts's own `set(loadProgress(userId))`) would leave that field
  // permanently stuck at whatever the store's OWN initial default happened to be, silently
  // diverging from every other field real progress data already reflects.
  return { ...getDefaultProgress(), ...parsed };
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
