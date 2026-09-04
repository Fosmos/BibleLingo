// Cheap layered-sine "value noise" — smooth, deterministic pseudo-randomness for canvas
// effects (fog drift, screen shake) that doesn't need a real Perlin/Simplex implementation.
// Summing a few sine waves at irrational-ish frequency ratios avoids them lining up into an
// obviously periodic pattern within any one game session's timescale. Output is in [-1, 1].
export function noise1(t: number, seed = 0): number {
  return (
    Math.sin(t * 1.0 + seed) * 0.5 +
    Math.sin(t * 2.13 + seed * 1.7) * 0.3 +
    Math.sin(t * 4.41 + seed * 2.3) * 0.2
  );
}

export function noise2(t: number, seedX = 0, seedY = 100): { x: number; y: number } {
  return { x: noise1(t, seedX), y: noise1(t, seedY) };
}
