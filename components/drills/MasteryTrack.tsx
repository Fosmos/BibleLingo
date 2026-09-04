"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { renderMasteryScene } from "@/lib/masteryCanvasScene";
import { spawnParticles, stepParticles, footstepParticles, type MasteryParticle } from "@/lib/masteryParticles";
import { decayTrauma, boostTrauma } from "@/lib/masteryScreenShake";
import { sampleTrail, type TrailPoint } from "@/lib/masteryTrail";
import { observeCanvasSize } from "@/lib/masteryCanvasResize";

interface MasteryTrackProps {
  playerPercent: number;
  chaserPercent: number;
  advanceTick: number; // bumped on every correct letter — triggers a runner hop + dust burst
  surgeTick: number; // bumped only on a fast/rhythmic streak — triggers a glow + shake pulse
  gapWords: number;
}

const VIEWPORT_SPAN = 22;
const PLAYER_ANCHOR = 0.4;
const GAP_METER_CAP_WORDS = 8;
const HOP_DURATION_MS = 300;
const SURGE_DURATION_MS = 600;
const TRAIL_LENGTH = 4;
const TRAIL_SAMPLE_EVERY_MS = 70;
const CLOSE_CALL_PROXIMITY = 0.85;

function viewportFraction(percent: number, cameraLow: number): number {
  return Math.min(1, Math.max(0, (percent - cameraLow) / VIEWPORT_SPAN));
}

// useSyncExternalStore (not useState+effect) so the server/client-hydration render and the
// first real read of matchMedia can never disagree — same rationale as lib/useHasMounted.ts.
function subscribeDarkMode(onChange: () => void): () => void {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}
function getDarkModeSnapshot(): boolean {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}
function getServerDarkModeSnapshot(): boolean {
  return false;
}

// The Red Sea chase, drawn on a <canvas> — parallax depth, a rim-lit wall, a reflective
// ground band, a composite runner, a chariot with a looming glow, drifting fog, and
// footstep/close-call driven particles + screen shake. Drawing itself lives in
// lib/masteryCanvas*.ts (see masteryCanvasScene.ts for draw order); this component just owns
// canvas lifecycle and per-frame simulation state (camera, particles, trail, timers).
export function MasteryTrack({ playerPercent, chaserPercent, advanceTick, surgeTick, gapWords }: MasteryTrackProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sizeRef = useRef({ width: 0, height: 0 });
  const dprRef = useRef(1);
  const isDark = useSyncExternalStore(subscribeDarkMode, getDarkModeSnapshot, getServerDarkModeSnapshot);

  const hopStartRef = useRef(0);
  const surgeStartRef = useRef(0);
  const strideRef = useRef(0);
  const footstepPhaseRef = useRef(0);
  const prevPlayerPercentRef = useRef(playerPercent);
  const prevProximityRef = useRef(0);
  const traumaRef = useRef(0);
  const particlesRef = useRef<MasteryParticle[]>([]);
  const runnerPosRef = useRef({ x: 0, y: 0 });
  const trailRef = useRef<TrailPoint[]>([]);
  const lastTrailSampleRef = useRef(0);
  const propsRef = useRef({ playerPercent, chaserPercent, gapWords });

  // The rAF loop reads propsRef every frame instead of closing over props directly, so it
  // never needs to restart when playerPercent/chaserPercent/gapWords change.
  useEffect(() => {
    propsRef.current = { playerPercent, chaserPercent, gapWords };
  }, [playerPercent, chaserPercent, gapWords]);

  // Ref timestamps (not React state) for hop/surge — nothing about them affects JSX, and this
  // avoids an extra render on every keystroke.
  useEffect(() => {
    hopStartRef.current = performance.now();
    if (advanceTick === 0) return;
    particlesRef.current = particlesRef.current.concat(
      spawnParticles(runnerPosRef.current.x, runnerPosRef.current.y, 10, "dust"),
    );
  }, [advanceTick]);

  useEffect(() => {
    surgeStartRef.current = performance.now();
    if (surgeTick === 0) return;
    traumaRef.current = boostTrauma(traumaRef.current, 0.35);
  }, [surgeTick]);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    return observeCanvasSize(container, canvas, ({ width, height, dpr }) => {
      sizeRef.current = { width, height };
      dprRef.current = dpr;
    });
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    let frameId: number;
    let lastTs = performance.now();

    const frame = (ts: number): void => {
      const dtSeconds = Math.min((ts - lastTs) / 1000, 0.05);
      lastTs = ts;
      const { width, height } = sizeRef.current;
      if (width === 0 || height === 0) {
        frameId = requestAnimationFrame(frame);
        return;
      }
      const timeSeconds = ts / 1000;
      const { playerPercent: player, chaserPercent: chaser, gapWords: gap } = propsRef.current;
      const cameraLow = Math.min(Math.max(player - VIEWPORT_SPAN * PLAYER_ANCHOR, 0), Math.max(0, 100 - VIEWPORT_SPAN));
      const playerY = height - viewportFraction(player, cameraLow) * height;
      const chaserY = height - viewportFraction(chaser, cameraLow) * height;
      const centerX = width / 2;
      const proximity = Math.min(1, Math.max(0, 1 - gap / GAP_METER_CAP_WORDS));

      if (proximity >= CLOSE_CALL_PROXIMITY && prevProximityRef.current < CLOSE_CALL_PROXIMITY) {
        traumaRef.current = boostTrauma(traumaRef.current, 0.5);
      }
      prevProximityRef.current = proximity;
      traumaRef.current = decayTrauma(traumaRef.current, dtSeconds);

      const rawVelocity = dtSeconds > 0.001 ? (player - prevPlayerPercentRef.current) / dtSeconds : 0;
      prevPlayerPercentRef.current = player;
      strideRef.current += dtSeconds * (4 + Math.min(9, Math.abs(rawVelocity) * 0.35));

      const hopElapsed = ts - hopStartRef.current;
      const hopLift = hopElapsed < HOP_DURATION_MS ? Math.sin((hopElapsed / HOP_DURATION_MS) * Math.PI) : 0;
      const surgeAlpha = ts - surgeStartRef.current < SURGE_DURATION_MS ? 1 - (ts - surgeStartRef.current) / SURGE_DURATION_MS : 0;

      runnerPosRef.current = { x: centerX, y: playerY };
      const sampled = sampleTrail(trailRef.current, ts, lastTrailSampleRef.current, TRAIL_SAMPLE_EVERY_MS, TRAIL_LENGTH, {
        x: centerX,
        y: chaserY,
      });
      trailRef.current = sampled.trail;
      lastTrailSampleRef.current = sampled.lastSampleTs;

      const footstep = footstepParticles(strideRef.current, footstepPhaseRef.current, centerX, playerY, Math.abs(rawVelocity) > 0.5);
      particlesRef.current = particlesRef.current.concat(footstep.particles);
      footstepPhaseRef.current = footstep.wrappedPhase;

      if (Math.random() < dtSeconds * 4) {
        particlesRef.current = particlesRef.current.concat(spawnParticles(centerX, chaserY, 1, "dust"));
      }
      particlesRef.current = stepParticles(particlesRef.current, dtSeconds).filter((p) => p.y < height + 20);

      const finishRaw = height - viewportFraction(100, cameraLow) * height;
      const finishY = finishRaw >= -20 && finishRaw <= height + 20 ? finishRaw : null;

      renderMasteryScene(ctx, canvas, {
        width,
        height,
        timeSeconds,
        isDark,
        trauma: traumaRef.current,
        centerX,
        playerY,
        chaserY,
        finishY,
        proximity,
        stridePhase: strideRef.current,
        hopLift,
        surgeAlpha,
        trail: trailRef.current,
        particles: particlesRef.current,
        dpr: dprRef.current,
      });

      frameId = requestAnimationFrame(frame);
    };

    frameId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(frameId);
  }, [isDark]);

  return (
    <div className="flex flex-1 flex-col gap-2">
      <div ref={containerRef} className="relative flex-1 overflow-hidden">
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      </div>
      <p className="text-center text-sm font-semibold text-ink-soft">
        {gapWords > 0 ? `${gapWords} word${gapWords === 1 ? "" : "s"} ahead` : "The chariots are right behind you!"}
      </p>
    </div>
  );
}
