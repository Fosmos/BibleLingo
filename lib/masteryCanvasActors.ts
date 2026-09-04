// Pure canvas-drawing helpers for Mastery Mode's two characters: a stick-figure runner with
// a procedural leg/arm swing cycle, and a pursuing chariot silhouette trailed by faded
// "motion-blur" ghost copies of its own recent positions. No React, no DOM beyond the 2D
// context passed in — MasteryTrack.tsx drives these every frame.
import { MASTERY_COLORS, rgba } from "@/lib/masteryCanvasTheme";
import type { MasteryParticle } from "@/lib/masteryParticles";

const LIMB_SWING = 0.65;

export interface RunnerDrawOptions {
  stridePhase: number;
  hopLift: number;
  surgeAlpha: number;
}

export function drawRunner(ctx: CanvasRenderingContext2D, x: number, y: number, options: RunnerDrawOptions): void {
  const { stridePhase, hopLift, surgeAlpha } = options;
  const bob = Math.sin(stridePhase * 2) * 1.5;
  const centerY = y - hopLift * 26 + bob;
  const scale = 1 + hopLift * 0.12;
  const lean = Math.sin(stridePhase) * 0.08;

  ctx.save();
  ctx.translate(x, centerY);
  ctx.scale(scale, scale);

  // Additive rim light — always faintly present, flaring brighter on a surge — so the
  // runner reads as backlit against the dark wall rather than a flat silhouette.
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const rim = ctx.createRadialGradient(0, -10, 2, 0, -10, 30);
  const rimAlpha = 0.16 + surgeAlpha * 0.5;
  rim.addColorStop(0, rgba(MASTERY_COLORS.runnerGlowRgb, rimAlpha));
  rim.addColorStop(1, rgba(MASTERY_COLORS.runnerGlowRgb, 0));
  ctx.fillStyle = rim;
  ctx.beginPath();
  ctx.arc(0, -10, 30, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  drawCloak(ctx, stridePhase);

  ctx.strokeStyle = MASTERY_COLORS.runnerBody;
  ctx.lineWidth = 2.6;
  ctx.lineCap = "round";

  // Back limbs drawn first, torso (with a stride-driven lean) in the middle, front limbs
  // last — layered vector parts with their own transforms instead of one flat stick shape.
  const legSwing = Math.sin(stridePhase) * LIMB_SWING;
  drawLimb(ctx, 0, -6, legSwing, 13, false);
  const armSwingBack = Math.sin(stridePhase + Math.PI) * LIMB_SWING * 0.8;
  drawLimb(ctx, 0, -12, armSwingBack, 9, true);

  ctx.save();
  ctx.rotate(lean);
  ctx.beginPath();
  ctx.moveTo(0, -20);
  ctx.lineTo(0, -6);
  ctx.stroke();
  ctx.restore();

  drawLimb(ctx, 0, -6, -legSwing, 13, false);
  const armSwingFront = Math.sin(stridePhase + Math.PI) * LIMB_SWING * 0.8;
  drawLimb(ctx, 0, -12, -armSwingFront, 9, true);

  ctx.fillStyle = MASTERY_COLORS.runnerAccent;
  ctx.beginPath();
  ctx.arc(0, -25, 5.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// A flowing cloak/garment behind the torso, swaying opposite the stride so it reads as
// trailing motion rather than a static wedge — one bezier fill, cheap but gives the runner
// weight and silhouette beyond the bare limb lines.
function drawCloak(ctx: CanvasRenderingContext2D, stridePhase: number): void {
  const sway = Math.sin(stridePhase * 0.5) * 4;
  ctx.save();
  ctx.globalAlpha = 0.88;
  ctx.fillStyle = MASTERY_COLORS.runnerCloak;
  ctx.beginPath();
  ctx.moveTo(-4, -18);
  ctx.quadraticCurveTo(-10 + sway, -4, -6 + sway * 1.4, 10);
  ctx.quadraticCurveTo(0, 2, 4 + sway * 0.6, 9);
  ctx.quadraticCurveTo(9 - sway, -6, 4, -18);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawLimb(
  ctx: CanvasRenderingContext2D,
  originX: number,
  originY: number,
  swing: number,
  length: number,
  isArm: boolean,
): void {
  const dir = isArm ? -1 : 1;
  const endX = originX + Math.sin(swing) * length;
  const endY = originY + dir * Math.cos(swing) * length;
  ctx.beginPath();
  ctx.moveTo(originX, originY);
  ctx.lineTo(endX, endY);
  ctx.stroke();
}

export interface ChariotDrawOptions {
  trail: Array<{ x: number; y: number }>;
  proximity: number;
  timeSeconds: number;
}

export function drawChariot(ctx: CanvasRenderingContext2D, x: number, y: number, options: ChariotDrawOptions): void {
  const { trail, proximity, timeSeconds } = options;

  trail.forEach((point, index) => {
    const alpha = ((index + 1) / (trail.length + 1)) * 0.22;
    drawChariotShape(ctx, point.x, point.y, timeSeconds, alpha);
  });

  if (proximity > 0) {
    // A large, dark, non-additive glow looms behind the chariot first — grows with
    // proximity — then the smaller reddish additive glow sits on top of it, so closing the
    // gap reads as an encroaching shadow, not just a brighter light.
    const loomRadius = 60 + proximity * 55;
    const loom = ctx.createRadialGradient(x, y, 8, x, y, loomRadius);
    loom.addColorStop(0, `rgba(12,8,14,${0.4 * proximity})`);
    loom.addColorStop(1, "rgba(12,8,14,0)");
    ctx.fillStyle = loom;
    ctx.beginPath();
    ctx.arc(x, y, loomRadius, 0, Math.PI * 2);
    ctx.fill();

    const glow = ctx.createRadialGradient(x, y, 4, x, y, 30);
    glow.addColorStop(0, rgba(MASTERY_COLORS.chariotGlowRgb, 0.45 * proximity));
    glow.addColorStop(1, rgba(MASTERY_COLORS.chariotGlowRgb, 0));
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, 30, 0, Math.PI * 2);
    ctx.fill();
  }

  drawChariotShape(ctx, x, y, timeSeconds, 1);
}

function drawChariotShape(ctx: CanvasRenderingContext2D, x: number, y: number, timeSeconds: number, alpha: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha = alpha;

  ctx.fillStyle = MASTERY_COLORS.chariotBody;
  ctx.beginPath();
  ctx.moveTo(-9, -4);
  ctx.lineTo(9, -4);
  ctx.lineTo(12, 8);
  ctx.lineTo(-12, 8);
  ctx.closePath();
  ctx.fill();

  const spin = timeSeconds * 5;
  drawWheel(ctx, -8, 10, spin);
  drawWheel(ctx, 8, 10, spin);

  ctx.strokeStyle = MASTERY_COLORS.chariotAccent;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(6, -4);
  ctx.lineTo(16, -18);
  ctx.stroke();

  ctx.restore();
}

function drawWheel(ctx: CanvasRenderingContext2D, x: number, y: number, spin: number): void {
  ctx.strokeStyle = MASTERY_COLORS.chariotAccent;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(x, y, 5, 0, Math.PI * 2);
  ctx.stroke();
  for (let i = 0; i < 4; i += 1) {
    const angle = spin + (i * Math.PI) / 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(angle) * 5, y + Math.sin(angle) * 5);
    ctx.stroke();
  }
}

export function drawParticle(ctx: CanvasRenderingContext2D, particle: MasteryParticle): void {
  const alpha = Math.max(0, particle.life / particle.maxLife);
  ctx.fillStyle = particle.hue === "foam" ? `rgba(255,255,255,${alpha})` : `rgba(156,111,66,${alpha * 0.8})`;
  ctx.beginPath();
  ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
  ctx.fill();
}
