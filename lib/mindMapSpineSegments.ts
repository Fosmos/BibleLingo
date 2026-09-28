import { line, curveCatmullRom } from "d3-shape";
import type { LayoutPoint } from "@/lib/mindMapLayoutTypes";

// A d3-shape "context" (the same Canvas-like moveTo/lineTo/bezierCurveTo interface
// CanvasRenderingContext2D itself implements, and the one d3 curves are already written
// against) that, instead of concatenating every draw call into one big path string, records
// each individual point-to-point call as its OWN standalone "M ... C ..." path string. Lets
// MindMapLinks.tsx render one chapter spine as many independently-styled (dashed vs. solid)
// `<path>` segments while every segment's own curvature still comes from the SAME
// curveCatmullRom pass over the WHOLE point list — each segment already bends exactly the way
// it would inside one continuous smooth curve, accounting for its real neighbors' positions, not
// a naive straight line between just its own two endpoints (which reads as sharp zig-zag kinks
// the instant the wave amplitude is wide enough to notice).
class SegmentRecordingContext {
  readonly segments: string[] = [];
  // The same segments as numbers — [x0, y0, c1x, c1y, c2x, c2y, x1, y1] (a straight line's control
  // points sit on its ends) — for finding where a segment crosses a given height.
  readonly curves: number[][] = [];
  private currentX = 0;
  private currentY = 0;

  moveTo(x: number, y: number): void {
    this.currentX = x;
    this.currentY = y;
  }

  lineTo(x: number, y: number): void {
    this.segments.push(`M${this.currentX},${this.currentY} L${x},${y}`);
    this.curves.push([this.currentX, this.currentY, this.currentX, this.currentY, x, y, x, y]);
    this.currentX = x;
    this.currentY = y;
  }

  bezierCurveTo(c1x: number, c1y: number, c2x: number, c2y: number, x: number, y: number): void {
    this.segments.push(`M${this.currentX},${this.currentY} C${c1x},${c1y} ${c2x},${c2y} ${x},${y}`);
    this.curves.push([this.currentX, this.currentY, c1x, c1y, c2x, c2y, x, y]);
    this.currentX = x;
    this.currentY = y;
  }

  // curveCatmullRom never emits a quadratic segment or closes the path for a plain open line,
  // but d3's own Context type requires these — no-ops here are never actually reached.
  quadraticCurveTo(): void {}
  closePath(): void {}
  arc(): void {}
  rect(): void {}
}

// One "M x,y C ...,x,y" path per consecutive pair of `points`, in order — `segments.length ===
// points.length - 1`. See SegmentRecordingContext's own doc comment for why this beats either a
// single continuous path (no way to style one stretch of it differently) or a naive per-pair
// straight line (loses the smooth curvature the full curve would have had there).
function record(points: LayoutPoint[]): SegmentRecordingContext {
  const context = new SegmentRecordingContext();
  const generator = line<LayoutPoint>()
    .x((point) => point.x)
    .y((point) => point.y)
    .curve(curveCatmullRom)
    .context(context as unknown as CanvasRenderingContext2D);
  generator(points);
  return context;
}

export function splitSpineIntoSegments(points: LayoutPoint[]): string[] {
  return record(points).segments;
}

function bezier(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const u = 1 - t;
  return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3;
}

// Where the drawn path, on its way INTO `points[index]` (from the point before), crosses height
// `y` — e.g. where it meets the top edge of a hall's card, so the hall's gate can stand exactly
// over it (see MindMapHallGate.tsx). Falls back to the point's own x when the segment never
// reaches that height.
export function spineEntryX(points: LayoutPoint[], index: number, y: number): number {
  const curve = index > 0 ? record(points).curves[index - 1] : undefined;
  if (!curve) return points[index]?.x ?? 0;
  const [x0, y0, c1x, c1y, c2x, c2y, x1, y1] = curve;
  if ((y - y0) * (y - y1) > 0) return x1;
  let low = 0;
  let high = 1;
  for (let step = 0; step < 24; step++) {
    const mid = (low + high) / 2;
    if ((bezier(y0, c1y, c2y, y1, mid) - y) * (y0 - y) > 0) low = mid;
    else high = mid;
  }
  return bezier(x0, c1x, c2x, x1, (low + high) / 2);
}
