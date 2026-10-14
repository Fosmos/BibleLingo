import type { TrailSection, TrailStop } from "@/lib/trailStops";

// Positions for the winding trail (design_handoff_path_picker → Trail), on a 370px-wide column:
// each section banner takes 118px, each stop its size + 68 (70px stops, 84px checkpoints), each
// section ends with 6px more, and the finish banner 110. Stops weave across the column on a sine.
export const TRAIL_WIDTH = 370;
const AMPLITUDE = 80;

export type TrailItem =
  | { kind: "banner"; y: number; section: TrailSection; number: number }
  | { kind: "stop"; y: number; x: number; size: number; stop: TrailStop }
  | { kind: "finish"; y: number };

export function layoutTrail(sections: TrailSection[]): { items: TrailItem[]; height: number } {
  const items: TrailItem[] = [];
  let y = 22;
  let index = 0;
  sections.forEach((section, sectionIndex) => {
    items.push({ kind: "banner", y, section, number: sectionIndex + 1 });
    y += 118;
    for (const stop of section.stops) {
      const size = stop.checkpoint ? 84 : 70;
      items.push({ kind: "stop", y, x: TRAIL_WIDTH / 2 + Math.sin(index * 0.8) * AMPLITUDE, size, stop });
      y += size + 68;
      index++;
    }
    y += 6;
  });
  items.push({ kind: "finish", y });
  return { items, height: y + 110 };
}

// The road through the stops' centres: one cubic per gap, bending at the vertical midpoint.
export function roadPath(points: { x: number; y: number }[]): string {
  return points.map((point, i) => (i === 0 ? `M${point.x} ${point.y}` : `C${points[i - 1].x} ${(points[i - 1].y + point.y) / 2} ${point.x} ${(points[i - 1].y + point.y) / 2} ${point.x} ${point.y}`)).join(" ");
}
