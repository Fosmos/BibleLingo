// Reflective "wet ground" band: rather than re-drawing the whole scene a second time
// upside-down (expensive, and easy to let drift out of sync), this samples thin horizontal
// strips of pixels already rendered just above the band — including the runner and chariot,
// since they're drawn before this runs (see masteryCanvasScene.ts) — flips their vertical
// order, and re-draws them with a per-strip horizontal jitter. That's the standard cheap
// trick for a distorted water reflection on a 2D canvas, with no shader or offscreen buffer
// needed. Must run after the source region has been drawn for this frame.
const STRIP_HEIGHT = 4;

export function drawReflection(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  width: number,
  sourceTop: number,
  sourceHeight: number,
  bandTop: number,
  bandHeight: number,
  timeSeconds: number,
  dpr: number,
): void {
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, bandTop, width, bandHeight);
  ctx.clip();

  const tint = ctx.createLinearGradient(0, bandTop, 0, bandTop + bandHeight);
  tint.addColorStop(0, "rgba(30,58,138,0.28)");
  tint.addColorStop(1, "rgba(30,58,138,0.05)");
  ctx.fillStyle = tint;
  ctx.fillRect(0, bandTop, width, bandHeight);

  ctx.globalAlpha = 0.35;
  for (let y = 0; y < bandHeight; y += STRIP_HEIGHT) {
    const jitter = Math.sin(y * 0.2 + timeSeconds * 2.6) * 5;
    const srcY = (sourceTop + Math.max(0, sourceHeight - y - STRIP_HEIGHT)) * dpr;
    ctx.drawImage(
      canvas,
      0,
      srcY,
      width * dpr,
      STRIP_HEIGHT * dpr,
      jitter,
      bandTop + y,
      width,
      STRIP_HEIGHT,
    );
  }
  ctx.restore();
}
