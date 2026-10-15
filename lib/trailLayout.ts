import type { TrailSection, TrailStop } from "@/lib/trailStops";

// Positions for one section's trail (design_handoff_path_trail → SectionTrailScreen) on a 370px
// column: 58px stones, 70px checkpoints, 26px apart, swaying on sin(i·0.9), with 34px more above
// the stop that's up next for its bobbing START bubble, then the "Up next" banner below.
export const TRAIL_WIDTH = 370;
const CENTRE = TRAIL_WIDTH / 2;
const AMPLITUDE = 60;

export interface StoneLayout {
  x: number;
  y: number;
  size: number;
  stop: TrailStop;
}

export function layoutSectionTrail(section: TrailSection): { stones: StoneLayout[]; bannerTop: number; height: number } {
  const stones: StoneLayout[] = [];
  let y = 52;
  section.stops.forEach((stop, index) => {
    const size = stop.checkpoint ? 70 : 58;
    if (stop.state === "current" && index > 0) y += 34;
    stones.push({ x: CENTRE + Math.sin(index * 0.9) * AMPLITUDE, y, size, stop });
    y += size + 26;
  });
  const bannerTop = y + 16;
  return { stones, bannerTop, height: bannerTop + 110 };
}

// The road through the stones' centres: one cubic per gap, bending at the vertical midpoint.
export function roadPath(points: { x: number; y: number }[]): string {
  return points.map((point, i) => (i === 0 ? `M${point.x} ${point.y}` : `C${points[i - 1].x} ${(points[i - 1].y + point.y) / 2} ${point.x} ${(points[i - 1].y + point.y) / 2} ${point.x} ${point.y}`)).join(" ");
}
