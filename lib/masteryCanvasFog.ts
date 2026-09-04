// Screen-space mist: a few soft, semi-transparent gradient bands drifting sideways at
// different speeds and heights. Deliberately drawn after the world scene and outside the
// screen-shake transform (see masteryCanvasScene.ts) so it reads as haze on the lens, not
// fog that shakes along with the chase itself.
import { noise1 } from "@/lib/masteryCanvasNoise";

const BAND_COUNT = 3;
const BAND_HEIGHT_FRACTION = 0.22;

export function drawFogOverlay(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  timeSeconds: number,
  dark: boolean,
): void {
  ctx.save();
  for (let i = 0; i < BAND_COUNT; i += 1) {
    const speed = 5 + i * 3.5;
    const centerX = ((timeSeconds * speed + i * 137) % (width * 2)) - width * 0.5;
    const bandY = height * (0.12 + i * 0.3) + noise1(timeSeconds * 0.12, i * 5.1) * 16;
    const bandHeight = height * BAND_HEIGHT_FRACTION;
    const gradient = ctx.createLinearGradient(centerX - width, bandY, centerX + width, bandY + bandHeight);
    const alpha = dark ? 0.05 + i * 0.015 : 0.09 + i * 0.02;
    gradient.addColorStop(0, "rgba(255,255,255,0)");
    gradient.addColorStop(0.5, `rgba(255,255,255,${alpha})`);
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, bandY, width, bandHeight);
  }
  ctx.restore();
}
