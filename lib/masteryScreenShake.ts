// Trauma-based screen shake (the standard game-feel technique: an impact adds "trauma",
// trauma decays over time, and the actual pixel offset is trauma-squared so small bumps stay
// subtle while stacked hits get sharply worse). Pure functions — MasteryTrack.tsx keeps the
// trauma value itself in a ref and calls these each frame.
import { noise2 } from "@/lib/masteryCanvasNoise";

const DECAY_PER_SECOND = 1.6;
const MAX_OFFSET_PX = 10;

export function decayTrauma(trauma: number, dtSeconds: number): number {
  return Math.max(0, trauma - DECAY_PER_SECOND * dtSeconds);
}

export function boostTrauma(trauma: number, amount: number): number {
  return Math.min(1, trauma + amount);
}

export function shakeOffset(trauma: number, timeSeconds: number): { x: number; y: number } {
  const magnitude = trauma * trauma * MAX_OFFSET_PX;
  const { x, y } = noise2(timeSeconds * 18, 3.1, 47.7);
  return { x: x * magnitude, y: y * magnitude };
}
