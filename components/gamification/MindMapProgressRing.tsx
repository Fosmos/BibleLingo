import type { MindMapNodeSize } from "@/lib/useMindMapNodeSizes";

interface MindMapProgressRingProps {
  // Undefined/0 draws nothing — see MindMapRingNode.tsx's own `progress` doc comment for what
  // feeds this (a chapter's pericope-complete ratio, or every other ring kind's own
  // chapter-graduated percent).
  progress: number | undefined;
  // A plain circle's own diameter — ignored whenever `shape` is set (a "pill" traces
  // `measuredSize` instead, see below).
  size?: number;
  // "pill": a theme node's own capsule shape — a stadium outline (corner radius = half the
  // height) traced around its real measured box, since it's wider than tall and a plain circle
  // would match neither its shape nor its size. Undefined (default) draws the plain circle.
  shape?: "pill";
  // A `pill` node's own real measured DOM box (see lib/useMindMapNodeSizes.ts) — undefined for
  // one frame before its first real measurement lands, during which the ring simply doesn't
  // draw yet rather than guessing at a size.
  measuredSize?: MindMapNodeSize;
  // Something under this node is due for SRS review (see lib/srsScopeStatus.ts) — the sweep
  // turns yellow, and a node with no progress of its own yet draws its ring in full so the cue
  // still shows.
  due?: boolean;
}

const STROKE_WIDTH_PX = 3;
const GAP_PX = 3;

// This node's own progress sweep — drawn OUTSIDE its own border (GAP_PX, both shapes) so it
// never competes with the fixed `border-2` ring/pill chrome the node already wears, filling as
// `progress` climbs toward 1 in a single consistent green (the sweep itself already shows "how
// far along," so a color change on top would just be a second, redundant signal for the same
// information). The SVG itself is padded a further stroke-width-plus-a-pixel beyond the swept
// shape's own outer edge — an SVG element clips its own content to its own viewport by default,
// and a stroke centers ON its path, so its outer half would otherwise get cut off the instant
// the ring reads anything above 0%. Split out of MindMapRingNode.tsx purely to keep that file
// under this codebase's own 200-line file cap (see CLAUDE.md) — no behavior difference from
// having it inline there.
export function MindMapProgressRing({ progress, size, shape, measuredSize, due }: MindMapProgressRingProps) {
  const hasProgress = progress !== undefined && progress > 0;
  if (!hasProgress && !due) return null;
  const filled = hasProgress ? Math.min(1, progress) : 1;
  const strokeClass = due ? "stroke-yellow-400" : "stroke-green-500";
  const strokeWidth = STROKE_WIDTH_PX;
  const gap = GAP_PX;

  if (shape === "pill") {
    if (!measuredSize) return null;
    // A stadium (corner radius = half the height, the exact same "fully round the corners"
    // shape `rounded-full` already renders for a wider-than-tall box, see MindMapLinks.tsx's own
    // maskRectFor) traced around the node's real measured box. Perimeter is the two straight
    // sides (2 * (width - 2*rx) + 2 * (height - 2*rx)) plus one full circle's worth of
    // circumference for the four corner arcs combined (2π*rx). No -90deg rotation needed
    // (unlike the circle below) — the outline already reads naturally from its top edge.
    const w = measuredSize.width + gap * 2;
    const h = measuredSize.height + gap * 2;
    const rx = h / 2;
    const perimeter = 2 * (w - 2 * rx) + 2 * (h - 2 * rx) + 2 * Math.PI * rx;
    const offset = (strokeWidth + 2) / 2;
    return (
      <svg
        aria-hidden="true"
        width={w + strokeWidth + 2}
        height={h + strokeWidth + 2}
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
      >
        <rect
          x={offset}
          y={offset}
          width={w}
          height={h}
          rx={rx}
          fill="none"
          strokeWidth={strokeWidth}
          className={strokeClass}
          strokeDasharray={perimeter}
          strokeDashoffset={perimeter * (1 - filled)}
        />
      </svg>
    );
  }

  // Rotated -90deg so the sweep starts at 12 o'clock, the familiar "loading ring" convention,
  // and fills clockwise as `progress` climbs.
  const radius = (size ?? 0) / 2 + gap;
  const circumference = 2 * Math.PI * radius;
  const svgSize = radius * 2 + strokeWidth + 2;
  const center = svgSize / 2;
  return (
    <svg
      aria-hidden="true"
      width={svgSize}
      height={svgSize}
      className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-90"
    >
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        className={strokeClass}
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - filled)}
      />
    </svg>
  );
}
