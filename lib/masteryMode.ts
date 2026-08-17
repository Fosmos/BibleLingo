export interface MasteryLevelConfig {
  level: number;
  label: string;
  tagline: string;
  description: string;
  // Words/sec the pursuing chariot advances at, regardless of the player's own speed — a
  // steady baseline pursuit pace. This is what makes hesitating costly on its own, not just
  // mistakes: falling behind this pace for even a moment lets the gap start narrowing.
  chariotPace: number;
  // How many words of head start the player begins with.
  startGap: number;
  // Words the chariot leaps forward on a wrong letter — the player never loses progress on
  // a mistake, they just get re-prompted for the same word while the chariot closes in.
  chaserJumpOnMistake: number;
  // Words/sec² of friction applied to the runner's own momentum every frame (see
  // lib/masteryPhysics.ts) — how fast a typing pause bleeds off speed, from a full sprint
  // down through a jog to a coasting walk. Higher values demand a near-continuous pace.
  decayRate: number;
}

export const MASTERY_LEVELS: MasteryLevelConfig[] = [
  {
    level: 1,
    label: "Level 1",
    tagline: "Warm-Up",
    description:
      "A slow-moving chariot and a big head start — good for a passage you just memorized and are still a little choppy on.",
    chariotPace: 0.3,
    startGap: 10,
    chaserJumpOnMistake: 1,
    decayRate: 0.6,
  },
  {
    level: 2,
    label: "Level 2",
    tagline: "Steady",
    description: "The chariot picks up its pace. Small slip-ups are still forgivable.",
    chariotPace: 0.5,
    startGap: 8,
    chaserJumpOnMistake: 1,
    decayRate: 0.9,
  },
  {
    level: 3,
    label: "Level 3",
    tagline: "Confident",
    description: "A real race now — you need to know the passage, not just recognize it.",
    chariotPace: 0.75,
    startGap: 6,
    chaserJumpOnMistake: 2,
    decayRate: 1.3,
  },
  {
    level: 4,
    label: "Level 4",
    tagline: "Sharp",
    description: "Fast and unforgiving — one or two mistakes can end the run.",
    chariotPace: 1.05,
    startGap: 4,
    chaserJumpOnMistake: 2,
    decayRate: 1.8,
  },
  {
    level: 5,
    label: "Level 5",
    tagline: "Mastery",
    description:
      "A quick-talking pace with almost no room for error. Clear this and the passage is officially Mastered.",
    chariotPace: 1.45,
    startGap: 3,
    chaserJumpOnMistake: 3,
    decayRate: 2.4,
  },
];

export function getMasteryLevel(level: number): MasteryLevelConfig {
  const clamped = Math.min(Math.max(level, 1), MASTERY_LEVELS.length);
  return MASTERY_LEVELS[clamped - 1];
}

export function clampPercent(value: number): number {
  return Math.min(100, Math.max(0, value));
}

// Stable key for tracking the best-cleared level per passage+translation — Mastery Mode
// operates on any arbitrary verse/chapter/book selection, not just tracked SRS entities,
// so this can't reuse MemorizedEntity ids.
export function masteryPassageKey(pathKey: string, version: string): string {
  return `${pathKey}|${version}`;
}

// Sticker key for a single level clear, keyed separately per level so every level earns
// its own collectible rather than one sticker per passage. Uses "::" (never appears in a
// pathKey, which only uses ":" once and "|" for its own fields) so the embedded pathKey can
// be split back out cleanly and re-resolved by lib/memorizationContent.ts's
// resolvePathLabel — that's also where the sticker's display title is built.
export function masteryStickerKey(pathKey: string, version: string, level: number): string {
  return `mastery:${pathKey}::${version}::${level}`;
}
