// Shared Framer Motion timing so every animated component eases/durates consistently.
export const MOTION_DURATION = {
  fast: 0.15,
  base: 0.25,
  slow: 0.4,
} as const;

export const MOTION_EASE = {
  enter: "easeOut",
  exit: "easeIn",
} as const;

export const TAP_SCALE = { scale: 0.96 } as const;

export const FADE_UP = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
} as const;

export const MODAL_BACKDROP = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
} as const;

export const MODAL_CARD = {
  initial: { opacity: 0, scale: 0.95, y: 8 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95, y: 8 },
} as const;
