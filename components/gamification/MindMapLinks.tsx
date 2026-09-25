import { useId } from "react";
import { linkVertical } from "d3-shape";
import type { LayoutPoint, MindMapLayout } from "@/lib/mindMapTreeLayout";
import type { MindMapDatum } from "@/lib/mindMapHierarchy";
import { LINK_STROKE_CLASS, SPINE_SOLID_BROWN_CLASS } from "@/lib/mindMapGenreColor";
import { ACTIVE_SCALE, INACTIVE_SCALE } from "@/lib/useMindMapFocusState";
import type { MindMapNodeSize } from "@/lib/useMindMapNodeSizes";
import { splitSpineIntoSegments, spineEntryX } from "@/lib/mindMapSpineSegments";
import { RING_SIZE_PX } from "@/components/gamification/MindMapRingNode";
import { MindMapHallGate } from "@/components/gamification/MindMapHallGate";

interface MindMapLinksProps {
  layout: MindMapLayout;
  isOnFocusedBranch: (id: string) => boolean;
  // The single open trail (see BookMindMap.tsx's own CAFD doc comment) — a dimmed node's own
  // mask hole below (see maskRectFor) needs the exact same CSS scale() its own card renders at
  // (MindMapNodeCard.tsx's `sizeScale`), or the hole would be the wrong size for what it's
  // actually covering.
  activePath: string[];
  // Real measured width/height for every content-sized node (a pericope card, a theme pill —
  // see lib/useMindMapNodeSizes.ts's own doc comment on why a plain ring/root's exact formula
  // size doesn't need this). Keyed by node id.
  nodeSizeById: Map<string, MindMapNodeSize>;
}

// lib/mindMapTreeLayout.ts already hands back each link's own (x, y) pair for both ends, node
// CENTER to node CENTER — straight accessors, no per-link special-casing here. linkVertical
// (not linkRadial) draws a smooth vertical S-curve between a parent and each child, the
// standard connector shape for a top-down dendrogram; a chapter's own pericopes instead draw as
// one continuous spine (see spineGenerator below, and layout.spines).
const linkGenerator = linkVertical<{ source: LayoutPoint; target: LayoutPoint }, LayoutPoint>()
  .x((point) => point.x)
  .y((point) => point.y);

// Mirrors MindMapNodeCard.tsx's own `sizeScale` prop exactly for every kind that can still be
// dimmed (root and pericope never are — see isDimmed below, so neither is reached here) — a
// dimmed node's own real on-screen box is this CSS scale() applied on top of its plain
// layout-space size, and the mask hole below has to match that same real box, not the unscaled
// one.
function nodeScale(data: MindMapDatum, activePath: string[]): number {
  return activePath.includes(data.id) ? ACTIVE_SCALE : INACTIVE_SCALE;
}

// True for any node currently rendered at less than full (25%) opacity (see
// MindMapRingNode.tsx's own `dimmed` prop) — exactly the set of nodes whose own incoming/
// outgoing line needs a mask hole cut for it below: a fully OPAQUE node already hides the line
// drawn straight through its own center just by sitting on top of it in normal DOM stacking
// order, no masking needed. Root and pericope cards are never dimmed (a pericope's own progress
// reads through its spine segments now — see SpinePoint's own `completed` — not through fading
// the card itself), so neither ever needs a hole cut for it.
function isDimmed(data: MindMapDatum, isOnFocusedBranch: (id: string) => boolean): boolean {
  if (data.kind === "root" || data.kind === "pericope") return false;
  return !isOnFocusedBranch(data.id);
}

// This node's own real on-screen box (already scaled) — measured (pericope, theme) where
// available, else RING_SIZE_PX's own exact formula (every other non-root kind is a plain fixed-
// diameter circle). Falls back to a generous guess for one frame before a content-sized node's
// first real measurement lands (see lib/useMindMapNodeSizes.ts) — better to mask a touch too
// much for a frame than too little.
function nodeBoxSize(data: MindMapDatum, nodeSizeById: Map<string, MindMapNodeSize>): { width: number; height: number } {
  const measured = nodeSizeById.get(data.id);
  if (measured) return measured;
  if (data.kind === "theme") return { width: 118, height: 78 };
  return { width: RING_SIZE_PX[data.kind as Exclude<MindMapDatum["kind"], "root" | "pericope" | "theme">], height: RING_SIZE_PX[data.kind as Exclude<MindMapDatum["kind"], "root" | "pericope" | "theme">] };
}

// The <mask> hole for one dimmed node — a rect sized to its own real (scaled) box, corner-
// rounded to a perfect circle for a square ring, a capsule for a wider-than-tall theme pill —
// both are just "fully round the corners" the same CSS class already does, so rx/ry = half the
// (shorter) height reproduces it exactly. Pericopes are never dimmed (see isDimmed above), so
// this never needs to account for a pericope card's own `rounded-xl` shape.
function maskRectFor(node: MindMapLayout["nodes"][number], nodeSizeById: Map<string, MindMapNodeSize>, activePath: string[]) {
  const scale = nodeScale(node.data, activePath);
  const { width, height } = nodeBoxSize(node.data, nodeSizeById);
  const w = width * scale;
  const h = height * scale;
  return { x: node.cx - w / 2, y: node.cy - h / 2, width: w, height: h, rx: h / 2 };
}

// The canvas's own connector SVG — every ordinary parent/child curve, plus a chapter's own
// winding pericope spine (see lib/mindMapTreeLayout.ts's own placePericopes) — split out of
// BookMindMap.tsx purely to keep that file under this codebase's own 200-line file cap (see
// CLAUDE.md), no behavior difference from having it inline there.
//
// Every line/spine is drawn its own full, real length, node CENTER to node CENTER — no
// endpoint trimming/approximation of any kind. A fully opaque (not dimmed) node already covers
// whatever's drawn under its own center just by sitting on top of it in normal DOM order; a
// DIMMED node (25% opacity) does not, so a <mask> instead cuts a real hole — shaped and sized
// to match that one node's own real on-screen box (see maskRectFor) — out of the whole
// connector layer, applied via the <g> below. This sidesteps ever having to approximate where a
// content-sized card's own edge really falls (a fixed guess generous enough for the widest
// label was never tight enough for a shorter one's, and vice versa, see git history) — the
// masked-out region IS that node's own real box, not an approximation of it.
export function MindMapLinks({ layout, isOnFocusedBranch, activePath, nodeSizeById }: MindMapLinksProps) {
  const maskId = useId();
  const dimmedNodes = layout.nodes.filter((node) => isDimmed(node.data, isOnFocusedBranch));

  return (
    <svg width={layout.width} height={layout.height} className="absolute inset-0">
      <defs>
        <mask id={maskId} maskUnits="userSpaceOnUse" x={0} y={0} width={layout.width} height={layout.height}>
          <rect x={0} y={0} width={layout.width} height={layout.height} fill="white" />
          {dimmedNodes.map((node) => {
            const rect = maskRectFor(node, nodeSizeById, activePath);
            return <rect key={node.data.id} {...rect} fill="black" />;
          })}
        </mask>
      </defs>
      <g mask={`url(#${maskId})`}>
        {/* Each spine draws as many short segments, not one path — the segment FROM a point
            TO the next one renders solid exactly once that earlier point's own verse/pericope
            (or, for the very first segment, the chapter itself) has actually been reached, so
            the line fills in behind the reader's own real progress instead of the whole
            chapter switching a uniform style the instant it's opened. Each segment's own "d" is
            pre-split (see splitSpineIntoSegments) from ONE curveCatmullRom pass over the WHOLE
            point list, so every segment still bends exactly the way it would inside one
            continuous smooth curve — a plain straight line between just two points reads as a
            sharp zig-zag kink the instant the verse wave's own amplitude is wide enough to
            notice, which a real "winding path" look can't afford. */}
        {layout.spines.map((spine) => {
          const segments = splitSpineIntoSegments(spine.points);
          return segments.map((d, index) => {
            const point = spine.points[index];
            // Drawn in the colour of the hall it leads into (see SpinePoint.stroke) — solid once
            // reached, dotted until then, so progress reads through the line's style, not its colour.
            const stroke = spine.points[index + 1]?.stroke;
            return (
              <path
                key={`${spine.parentId}-${index}`}
                d={d}
                fill="none"
                stroke={stroke}
                strokeWidth={point.completed ? 3 : 2.5}
                strokeLinecap="round"
                strokeDasharray={point.completed ? undefined : "1 8"}
                // A spine dims exactly when its own chapter isn't on the focused branch — see
                // BookMindMap.tsx's own top doc comment on CAFD / isOnFocusedBranch.
                className={`${stroke ? "" : point.completed ? SPINE_SOLID_BROWN_CLASS : LINK_STROKE_CLASS} transition-opacity duration-300 ${isOnFocusedBranch(spine.parentId) ? "opacity-100" : "opacity-25"}`}
              />
            );
          });
        })}
        {/* Each hall's gate, standing on top of its card right where the path arrives at it
            (MindMapHallGate.tsx) — drawn once the card's height has been measured. */}
        {layout.spines.flatMap((spine) =>
          spine.points.map((point, index) => {
            const size = point.hallId ? nodeSizeById.get(point.hallId) : undefined;
            if (!size) return null;
            const top = point.y - size.height / 2;
            return <MindMapHallGate key={`${point.hallId}-gate`} cx={spineEntryX(spine.points, index, top)} top={top} />;
          }),
        )}
        {layout.links.map((link, index) => (
          <path
            key={index}
            d={linkGenerator(link) ?? undefined}
            fill="none"
            strokeWidth={2}
            // A link dims exactly when the node it leads INTO isn't on the focused branch — see
            // BookMindMap.tsx's own top doc comment on CAFD / isOnFocusedBranch.
            className={`${LINK_STROKE_CLASS} transition-opacity duration-300 ${isOnFocusedBranch(link.targetId) ? "opacity-100" : "opacity-25"}`}
          />
        ))}
      </g>
    </svg>
  );
}
