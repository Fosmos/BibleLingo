import { useId } from "react";
import { linkVertical } from "d3-shape";
import type { LayoutPoint, MindMapLayout } from "@/lib/mindMapTreeLayout";
import type { MindMapDatum } from "@/lib/mindMapHierarchy";
import { LINK_STROKE_CLASS } from "@/lib/mindMapGenreColor";
import { ACTIVE_SCALE, INACTIVE_SCALE } from "@/lib/useMindMapFocusState";
import type { MindMapNodeSize } from "@/lib/useMindMapNodeSizes";
import { RING_SIZE_PX } from "@/components/gamification/MindMapRingNode";

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
// standard connector shape for a top-down dendrogram; a pericope's own stub (see
// MindMapLayoutLink.straight) instead draws as a plain straight segment off its chapter's own
// trunk (see layout.spines).
const linkGenerator = linkVertical<{ source: LayoutPoint; target: LayoutPoint }, LayoutPoint>()
  .x((point) => point.x)
  .y((point) => point.y);

// Rounded corner radius a pericope card's own `rounded-xl` renders at — see maskRectFor below.
const PERICOPE_CORNER_RADIUS_PX = 12;

// Mirrors MindMapNodeCard.tsx's own `sizeScale` prop exactly (a pericope by its own `status`,
// everything else by whether it's on the open trail — root is never dimmed, so never reached
// here) — a dimmed node's own real on-screen box is this CSS scale() applied on top of its
// plain layout-space size, and the mask hole below has to match that same real box, not the
// unscaled one.
function nodeScale(data: MindMapDatum, activePath: string[]): number {
  if (data.kind === "pericope") return data.status === "active" ? 1 : INACTIVE_SCALE;
  return activePath.includes(data.id) ? ACTIVE_SCALE : INACTIVE_SCALE;
}

// True for any node currently rendered at less than full (25%) opacity (see
// MindMapNodeCard.tsx/MindMapRingNode.tsx's own `dimmed` prop) — exactly the set of nodes whose
// own incoming/outgoing line needs a mask hole cut for it below: a fully OPAQUE node already
// hides the line drawn straight through its own center just by sitting on top of it in normal
// DOM stacking order, no masking needed.
function isDimmed(data: MindMapDatum, isOnFocusedBranch: (id: string) => boolean): boolean {
  if (data.kind === "root") return false;
  if (data.kind === "pericope") return data.status !== "active";
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
  if (data.kind === "pericope") return { width: 150, height: 90 };
  if (data.kind === "theme") return { width: 118, height: 78 };
  return { width: RING_SIZE_PX[data.kind as Exclude<MindMapDatum["kind"], "root" | "pericope" | "theme">], height: RING_SIZE_PX[data.kind as Exclude<MindMapDatum["kind"], "root" | "pericope" | "theme">] };
}

// The <mask> hole for one dimmed node — a rect sized to its own real (scaled) box, corner-
// rounded to match its own real shape: a pericope card's plain `rounded-xl`, or every other
// kind's `rounded-full` (a perfect circle for a square ring, a capsule for a wider-than-tall
// theme pill — both are just "fully round the corners" the same one CSS class already does, so
// rx/ry = half the (shorter) height reproduces it exactly either way).
function maskRectFor(node: MindMapLayout["nodes"][number], nodeSizeById: Map<string, MindMapNodeSize>, activePath: string[]) {
  const scale = nodeScale(node.data, activePath);
  const { width, height } = nodeBoxSize(node.data, nodeSizeById);
  const w = width * scale;
  const h = height * scale;
  const rx = node.data.kind === "pericope" ? PERICOPE_CORNER_RADIUS_PX * scale : h / 2;
  return { x: node.cx - w / 2, y: node.cy - h / 2, width: w, height: h, rx };
}

// The canvas's own connector SVG — every ordinary parent/child curve, plus a chapter's own
// pericope trunk-and-stubs (see lib/mindMapTreeLayout.ts's own placePericopes) — split out of
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
        {layout.spines.map((spine, index) => (
          <line
            key={index}
            x1={spine.x}
            y1={spine.y0}
            x2={spine.x}
            y2={spine.y1}
            strokeWidth={2}
            // A trunk dims exactly when its own chapter isn't on the focused branch — see
            // BookMindMap.tsx's own top doc comment on CAFD / isOnFocusedBranch.
            className={`${LINK_STROKE_CLASS} transition-opacity duration-300 ${isOnFocusedBranch(spine.parentId) ? "opacity-100" : "opacity-25"}`}
          />
        ))}
        {layout.links.map((link, index) => (
          <path
            key={index}
            d={link.straight ? `M${link.source.x},${link.source.y}L${link.target.x},${link.target.y}` : (linkGenerator(link) ?? undefined)}
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
