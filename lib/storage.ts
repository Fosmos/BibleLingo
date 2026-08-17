import type { UserProgress } from "@/types";

const STORAGE_PREFIX = "verses:progress:";
// Where progress lived before accounts existed. Consumed exactly once, by whichever
// account is the very first one ever signed up — see consumeLegacyProgress below.
const LEGACY_STORAGE_KEY = "verses:progress";
const SCHEMA_VERSION = 19;

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
    chapterReviewBestAccuracy: {},
    sessionCheckpoints: {},
    masteryLevels: {},
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

// One-time migration: before accounts existed, progress lived at a single unkeyed key.
// The first account ever created inherits that data as its starting state — this removes
// the legacy key the moment it's read, so every subsequent call (including from later
// signups) sees nothing left to migrate.
export function consumeLegacyProgress(): UserProgress | null {
  if (typeof window === "undefined") {
    return null;
  }
  const raw = window.localStorage.getItem(LEGACY_STORAGE_KEY);
  if (!raw) {
    return null;
  }
  window.localStorage.removeItem(LEGACY_STORAGE_KEY);
  return parseStoredProgress(raw);
}
