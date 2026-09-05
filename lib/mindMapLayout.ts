// Pure camera/viewport geometry for the Mind Map view (components/gamification/
// MindMapCanvas.tsx) — no React, no DOM, so the algebra can be reasoned about (and tested)
// on its own, same convention as lib/srs.ts. The book/chapter/pericope SHAPE itself (which
// side a chapter sits on, where its pericopes fan out to) lives in lib/mindMapShape.ts —
// kept separate purely to stay under this codebase's 200-line-per-file cap.

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

// The book node is a circle (not a pill like everything else) — big enough to hold 2-3
// wrapped lines of its own full ceremonial title (see lib/bibleBookTitles.ts), which is why
// it needs real radius rather than the tighter pill dimensions everything else uses.
export const BOOK_CIRCLE_RADIUS = 82;
export const CHAPTER_PILL_WIDTH = 92;
export const CHAPTER_PILL_HEIGHT = 44;
export const PERICOPE_PILL_WIDTH = 88;
export const PERICOPE_PILL_HEIGHT = 36;

export const OVERVIEW_SCALE = 1;
export const FOCUS_SCALE = 1.5;
export const MIN_SCALE = 0.5;
export const MAX_SCALE = 2.6;

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
