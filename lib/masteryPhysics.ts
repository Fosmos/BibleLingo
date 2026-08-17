// Pure, framework-agnostic momentum simulation for Mastery Mode's chase — no React, no
// side effects. MasteryChaseRound drives this every animation frame; everything here works
// in a single unit, "words," shared by the runner's position, the chariot's position, and
// the verse's own word count, so a position of e.g. 2.4 means "40% of the way past the
// second word."

// Velocity gained per correct letter, before any surge multiplier — deliberately large
// enough that a single correct answer can carry the runner's position all the way to the
// newly-revealed word within a fraction of a second, then decay takes over.
export const MASTERY_IMPULSE = 1.4;
// Consecutive correct letters faster than this apart count as a fluid, "quick-talking"
// rhythm and trigger the surge multiplier below.
export const MASTERY_SURGE_WINDOW_MS = 600;
// Velocity multiplier applied to the impulse when within the surge window — the "Pillar of
// Fire" boost that rewards typing in a fast, unbroken rhythm rather than one word at a time.
export const MASTERY_SURGE_MULTIPLIER = 1.6;

export interface MasteryPhysicsState {
  // Current forward speed, words/sec — decays toward 0 every frame via decayRate friction.
  playerVelocity: number;
  // The runner's continuous, physically-simulated position — always <= wordIndex, since a
  // correct letter is what raises the ceiling it can glide up to, not the glide itself.
  playerPosition: number;
  // The chariot's continuous position — advances at a steady pace every frame regardless
  // of the runner, plus a discrete leap forward on each mistake (applied by the caller).
  chaserPosition: number;
}

// Advances the simulation by one frame. `wordIndex` is the ceiling playerPosition glides
// toward (it can never run further than the words actually typed correctly so far).
export function stepMasteryPhysics(
  state: MasteryPhysicsState,
  dtSeconds: number,
  wordIndex: number,
  decayRate: number,
  chariotPace: number,
): MasteryPhysicsState {
  const playerVelocity = Math.max(0, state.playerVelocity - decayRate * dtSeconds);
  const playerPosition = Math.min(wordIndex, state.playerPosition + playerVelocity * dtSeconds);
  const chaserPosition = state.chaserPosition + chariotPace * dtSeconds;
  return { playerVelocity, playerPosition, chaserPosition };
}

// The velocity impulse a single correct letter contributes, and whether it qualified for
// the surge multiplier — `msSinceLastCorrect` is null for the very first correct letter of
// a round (no prior keystroke to compare against, so no surge).
export function impulseForKeypress(msSinceLastCorrect: number | null): { impulse: number; surged: boolean } {
  const surged = msSinceLastCorrect !== null && msSinceLastCorrect < MASTERY_SURGE_WINDOW_MS;
  return { impulse: MASTERY_IMPULSE * (surged ? MASTERY_SURGE_MULTIPLIER : 1), surged };
}
