// Three background depth layers drifting horizontally at different speeds — the classic
// parallax illusion — drawn back-to-front: distant twinkling motes, mid-distance drifting
// haze blobs (additive, so they glow instead of muddying the backdrop), then near-camera
// grit. Positions are derived from `index` with prime-ish multipliers rather than
// Math.random() so the layout is stable frame-to-frame and only timeSeconds animates it.
import { rgba } from "@/lib/masteryCanvasTheme";

interface ParallaxLayerSpec {
  count: number;
  speed: number;
  size: [number, number];
  alpha: number;
  yBand: [number, number];
}

const FAR: ParallaxLayerSpec = { count: 14, speed: 3, size: [0.6, 1.4], alpha: 0.35, yBand: [0, 0.55] };
const MID: ParallaxLayerSpec = { count: 8, speed: 9, size: [10, 22], alpha: 0.07, yBand: [0.2, 0.75] };
const NEAR: ParallaxLayerSpec = { count: 10, speed: 22, size: [1.5, 3], alpha: 0.5, yBand: [0.7, 1] };

function layerX(index: number, width: number, speed: number, timeSeconds: number, spread: number): number {
  const raw = (index * spread + timeSeconds * speed) % (width + spread);
  return raw - spread / 2;
}

export function drawFarLayer(ctx: CanvasRenderingContext2D, width: number, height: number, timeSeconds: number): void {
  ctx.save();
  for (let i = 0; i < FAR.count; i += 1) {
    const x = layerX(i, width, FAR.speed, timeSeconds, width / FAR.count);
    const y = height * (FAR.yBand[0] + (((i * 37) % 100) / 100) * (FAR.yBand[1] - FAR.yBand[0]));
    const size = FAR.size[0] + (i % 3) * ((FAR.size[1] - FAR.size[0]) / 2);
    const twinkle = 0.5 + 0.5 * Math.sin(timeSeconds * 2 + i * 3.1);
    ctx.fillStyle = `rgba(255,255,255,${FAR.alpha * twinkle})`;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function drawMidLayer(ctx: CanvasRenderingContext2D, width: number, height: number, timeSeconds: number): void {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < MID.count; i += 1) {
    const x = layerX(i, width, MID.speed, timeSeconds, width / MID.count);
    const y = height * (MID.yBand[0] + (((i * 53) % 100) / 100) * (MID.yBand[1] - MID.yBand[0]));
    const size = MID.size[0] + (i % 4) * ((MID.size[1] - MID.size[0]) / 3);
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, size);
    gradient.addColorStop(0, `rgba(255,255,255,${MID.alpha})`);
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(x, y, size, size * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function drawNearLayer(ctx: CanvasRenderingContext2D, width: number, height: number, timeSeconds: number): void {
  ctx.save();
  for (let i = 0; i < NEAR.count; i += 1) {
    const x = layerX(i, width, NEAR.speed, timeSeconds, width / NEAR.count);
    const y = height * (NEAR.yBand[0] + (((i * 71) % 100) / 100) * (NEAR.yBand[1] - NEAR.yBand[0]));
    const size = NEAR.size[0] + (i % 3) * ((NEAR.size[1] - NEAR.size[0]) / 2);
    ctx.fillStyle = rgba("120,113,108", NEAR.alpha);
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
