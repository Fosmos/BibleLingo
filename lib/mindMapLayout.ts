// Pure geometry for the Mind Map view (components/gamification/MindMapCanvas.tsx) — no
// React, no DOM, so the ring math and camera-centering algebra can be reasoned about (and
// tested) on their own, same convention as lib/srs.ts.

export interface Point {
  x: number;
  y: number;
}

export interface Camera {
  x: number;
  y: number;
  scale: number;
}

// The whole canvas is one fixed logical coordinate space, scaled to fit whatever screen size
// actually shows it (via the SVG's own viewBox/preserveAspectRatio) — every position and
// camera value in this module is in these units, never real screen pixels.
export const VIEWPORT_WIDTH = 900;
export const VIEWPORT_HEIGHT = 700;

export const BOOK_PILL_WIDTH = 140;
export const BOOK_PILL_HEIGHT = 56;
export const CHAPTER_NODE_RADIUS = 30;
export const PERICOPE_NODE_RADIUS = 24;
export const CHAPTER_RING_RADIUS = 260;
export const PERICOPE_RING_RADIUS = 130;

export const OVERVIEW_SCALE = 1;
export const FOCUS_SCALE = 1.9;
export const MIN_SCALE = 0.5;
export const MAX_SCALE = 2.6;

const RING_START_ANGLE = -Math.PI / 2;

// Evenly places `count` points on a circle of `radius` around `center`, starting at the top
// (12 o'clock) and going clockwise — the one layout rule this whole mind map uses, for both
// the chapter ring around the book pill and each chapter's own pericope ring.
export function ringLayout(count: number, radius: number, center: Point = { x: 0, y: 0 }): Point[] {
  if (count <= 0) return [];
  return Array.from({ length: count }, (_, index) => {
    const angle = RING_START_ANGLE + (index / count) * Math.PI * 2;
    return { x: center.x + radius * Math.cos(angle), y: center.y + radius * Math.sin(angle) };
  });
}

export function clampScale(scale: number): number {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));
}

// The camera (pan + scale) that puts `point` at the exact center of the viewport — used to
// animate "zoom into this chapter" and "zoom back out to the book." The canvas's own <g>
// transform is `translate(camera.x, camera.y) scale(camera.scale)`; SVG applies the scale to
// the group's content first, then the translate in the parent's own (unscaled) coordinate
// space, so solving for the camera that centers a world-space point is just: viewport center
// = point * scale + camera, rearranged to camera = viewport center - point * scale.
export function cameraCenteredOn(point: Point, scale: number): Camera {
  return {
    x: VIEWPORT_WIDTH / 2 - point.x * scale,
    y: VIEWPORT_HEIGHT / 2 - point.y * scale,
    scale,
  };
}

// Adjusts an existing camera's scale by `factor` while keeping whatever world-space point
// currently sits under `screenPoint` (the cursor, in the same viewBox units as the camera
// itself) fixed on screen — the standard "zoom toward the cursor" feel, rather than always
// zooming toward the world origin. Inverts the forward transform (screen = world * scale +
// camera) to find that world point, then re-solves the camera that keeps it under the same
// screen point at the new scale.
export function zoomTowardPoint(camera: Camera, screenPoint: Point, factor: number): Camera {
  const nextScale = clampScale(camera.scale * factor);
  const worldX = (screenPoint.x - camera.x) / camera.scale;
  const worldY = (screenPoint.y - camera.y) / camera.scale;
  return {
    x: screenPoint.x - worldX * nextScale,
    y: screenPoint.y - worldY * nextScale,
    scale: nextScale,
  };
}

export const OVERVIEW_CAMERA: Camera = cameraCenteredOn({ x: 0, y: 0 }, OVERVIEW_SCALE);
