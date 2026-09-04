// Per-frame draw order for the Mastery Mode chase scene — kept out of MasteryTrack.tsx so
// that component can stay a thin canvas-lifecycle/simulation-state owner (its own file
// comment says as much) while this owns the actual layering. World layers (backdrop through
// runner) are drawn inside a screen-shake translate; the reflection samples that already-
// rendered world (including the runner/chariot) before the shake transform is undone, so the
// reflection shakes together with the world. Fog and the HUD gap meter are drawn after the
// restore, in fixed screen space, so mist/UI never jitters with an impact.
import { drawBackdrop, drawOceanWall, drawWallRimLight, drawFoamFlecks, drawPillarOfFire } from "@/lib/masteryCanvasBackground";
import { drawFarLayer, drawMidLayer, drawNearLayer } from "@/lib/masteryCanvasParallax";
import { drawFogOverlay } from "@/lib/masteryCanvasFog";
import { drawReflection } from "@/lib/masteryCanvasReflection";
import { drawShoreMarker, drawGapMeter } from "@/lib/masteryCanvasHud";
import { drawRunner, drawChariot, drawParticle } from "@/lib/masteryCanvasActors";
import { shakeOffset } from "@/lib/masteryScreenShake";
import type { MasteryParticle } from "@/lib/masteryParticles";

export interface MasterySceneState {
  width: number;
  height: number;
  timeSeconds: number;
  isDark: boolean;
  trauma: number;
  centerX: number;
  playerY: number;
  chaserY: number;
  finishY: number | null;
  proximity: number;
  stridePhase: number;
  hopLift: number;
  surgeAlpha: number;
  trail: Array<{ x: number; y: number }>;
  particles: MasteryParticle[];
  dpr: number;
}

const GROUND_BAND_FRACTION = 0.22;

export function renderMasteryScene(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, state: MasterySceneState): void {
  const {
    width,
    height,
    timeSeconds,
    isDark,
    trauma,
    centerX,
    playerY,
    chaserY,
    finishY,
    proximity,
    stridePhase,
    hopLift,
    surgeAlpha,
    trail,
    particles,
    dpr,
  } = state;
  const shake = shakeOffset(trauma, timeSeconds);

  ctx.save();
  ctx.translate(shake.x, shake.y);

  drawBackdrop(ctx, width, height, isDark);
  drawFarLayer(ctx, width, height, timeSeconds);
  drawMidLayer(ctx, width, height, timeSeconds);
  drawOceanWall(ctx, width, height, "left", timeSeconds);
  drawOceanWall(ctx, width, height, "right", timeSeconds);
  drawWallRimLight(ctx, width, height, "left", timeSeconds);
  drawWallRimLight(ctx, width, height, "right", timeSeconds);
  drawFoamFlecks(ctx, width, height, "left", timeSeconds);
  drawFoamFlecks(ctx, width, height, "right", timeSeconds);
  drawPillarOfFire(ctx, width, timeSeconds);
  drawNearLayer(ctx, width, height, timeSeconds);

  if (finishY !== null) drawShoreMarker(ctx, width, finishY, isDark);

  for (const particle of particles) drawParticle(ctx, particle);
  drawChariot(ctx, centerX, chaserY, { trail, proximity, timeSeconds });
  drawRunner(ctx, centerX, playerY, { stridePhase, hopLift, surgeAlpha });

  const bandHeight = height * GROUND_BAND_FRACTION;
  const bandTop = height - bandHeight;
  const sourceTop = Math.max(0, bandTop - bandHeight);
  drawReflection(ctx, canvas, width, sourceTop, bandHeight, bandTop, bandHeight, timeSeconds, dpr);

  ctx.restore();

  drawFogOverlay(ctx, width, height, timeSeconds, isDark);
  drawGapMeter(ctx, width, proximity, isDark);
}
