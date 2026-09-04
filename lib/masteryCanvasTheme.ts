// Canvas fill/stroke calls need raw hex/rgba, not Tailwind classes — these mirror the
// brand/heart tokens in tailwind.config.ts so Mastery Mode's hand-drawn scene matches the
// rest of the app's palette instead of introducing its own.
export const MASTERY_COLORS = {
  wallDeep: "#1e3a8a",
  wallMid: "#3b82f6",
  wallEdge: "#93c5fd",
  runnerBody: "#743f22",
  runnerAccent: "#a2724d",
  runnerCloak: "#78350f",
  runnerGlowRgb: "162, 114, 77",
  chariotBody: "#7f1d1d",
  chariotAccent: "#dc2626",
  chariotGlowRgb: "220, 38, 38",
  flameCore: "#f59e0b",
  flameGlowRgb: "162, 114, 77",
  hudText: "#78716c",
  hudTextDark: "#a8a29e",
} as const;

export function rgba(rgbTriple: string, alpha: number): string {
  return `rgba(${rgbTriple}, ${alpha})`;
}

export const CANVAS_FONT = "system-ui, sans-serif";
