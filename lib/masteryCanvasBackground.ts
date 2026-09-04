// Pure canvas-drawing helpers for Mastery Mode's animated Red Sea backdrop — layered ocean
// walls with a moving wave-peak boundary, foam flecks, and a distant pillar-of-fire glow.
// No React, no DOM beyond the 2D context passed in; MasteryTrack.tsx drives these every frame.
import { MASTERY_COLORS, rgba } from "@/lib/masteryCanvasTheme";

const WALL_FRACTION = 0.26;
const WAVE_AMPLITUDE = 10;
const WAVE_FREQUENCY = 0.028;
const WAVE_SPEED = 1.4;

function wavyBoundaryX(baseX: number, y: number, timeSeconds: number, direction: 1 | -1): number {
  return baseX + direction * Math.sin(y * WAVE_FREQUENCY + timeSeconds * WAVE_SPEED) * WAVE_AMPLITUDE;
}

export function drawBackdrop(ctx: CanvasRenderingContext2D, width: number, height: number, dark: boolean): void {
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  if (dark) {
    gradient.addColorStop(0, "#09090b");
    gradient.addColorStop(1, "#18181b");
  } else {
    gradient.addColorStop(0, "#f2e9d8");
    gradient.addColorStop(1, "#f2efe9");
  }
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

export function drawOceanWall(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  side: "left" | "right",
  timeSeconds: number,
): void {
  const wallWidth = width * WALL_FRACTION;
  const direction: 1 | -1 = side === "left" ? 1 : -1;
  const baseX = side === "left" ? wallWidth : width - wallWidth;
  const outerX = side === "left" ? 0 : width;
  const steps = 24;

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(outerX, 0);
  for (let i = 0; i <= steps; i += 1) {
    const y = (height / steps) * i;
    ctx.lineTo(wavyBoundaryX(baseX, y, timeSeconds, direction), y);
  }
  ctx.lineTo(outerX, height);
  ctx.closePath();

  const gradient = ctx.createLinearGradient(side === "left" ? 0 : width, 0, baseX, 0);
  gradient.addColorStop(0, MASTERY_COLORS.wallDeep);
  gradient.addColorStop(0.6, MASTERY_COLORS.wallMid);
  gradient.addColorStop(1, MASTERY_COLORS.wallEdge);
  ctx.fillStyle = gradient;
  ctx.fill();

  ctx.strokeStyle = "rgba(255,255,255,0.85)";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  for (let i = 0; i <= steps; i += 1) {
    const y = (height / steps) * i;
    const x = wavyBoundaryX(baseX, y, timeSeconds, direction);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.restore();
}

// An additive-blended highlight traced along the same wavy boundary as drawOceanWall — the
// 'lighter' composite op makes it brighten whatever's beneath instead of covering it, giving
// the crest a glassy, backlit rim rather than a flat painted edge.
export function drawWallRimLight(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  side: "left" | "right",
  timeSeconds: number,
): void {
  const wallWidth = width * WALL_FRACTION;
  const direction: 1 | -1 = side === "left" ? 1 : -1;
  const baseX = side === "left" ? wallWidth : width - wallWidth;
  const steps = 24;

  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.strokeStyle = "rgba(191,219,254,0.5)";
  ctx.lineWidth = 5;
  ctx.beginPath();
  for (let i = 0; i <= steps; i += 1) {
    const y = (height / steps) * i;
    const x = wavyBoundaryX(baseX, y, timeSeconds, direction);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.restore();
}

export function drawFoamFlecks(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  side: "left" | "right",
  timeSeconds: number,
): void {
  const wallWidth = width * WALL_FRACTION;
  const direction: 1 | -1 = side === "left" ? 1 : -1;
  const baseX = side === "left" ? wallWidth : width - wallWidth;
  const count = 10;

  ctx.save();
  for (let i = 0; i < count; i += 1) {
    const seed = i * 47.3;
    const y = ((timeSeconds * 30 + seed * 9) % (height + 40)) - 20;
    const x = wavyBoundaryX(baseX, y, timeSeconds, direction) + direction * (4 + (i % 3) * 3);
    const alpha = Math.max(0, 0.35 + 0.35 * Math.sin(timeSeconds * 3 + seed));
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.beginPath();
    ctx.arc(x, y, 1.6 + (i % 3) * 0.6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function drawPillarOfFire(ctx: CanvasRenderingContext2D, width: number, timeSeconds: number): void {
  const x = width / 2;
  const y = 26;
  const flicker = 1 + Math.sin(timeSeconds * 6) * 0.08;

  const glow = ctx.createRadialGradient(x, y, 2, x, y, 26 * flicker);
  glow.addColorStop(0, rgba(MASTERY_COLORS.flameGlowRgb, 0.6));
  glow.addColorStop(1, rgba(MASTERY_COLORS.flameGlowRgb, 0));
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y, 26 * flicker, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = MASTERY_COLORS.flameCore;
  ctx.beginPath();
  ctx.moveTo(x, y + 14);
  ctx.bezierCurveTo(x - 8, y + 4, x - 6 * flicker, y - 10, x, y - 16 * flicker);
  ctx.bezierCurveTo(x + 6 * flicker, y - 10, x + 8, y + 4, x, y + 14);
  ctx.fill();
}
