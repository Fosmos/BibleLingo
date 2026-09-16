import { linkVertical } from "d3-shape";
import type { LayoutPoint, MindMapLayout } from "@/lib/mindMapTreeLayout";
import type { MindMapDatum } from "@/lib/mindMapHierarchy";
import { LINK_STROKE_CLASS } from "@/lib/mindMapGenreColor";
import { ACTIVE_SCALE, INACTIVE_SCALE } from "@/lib/useMindMapFocusState";
import { RING_SIZE_PX } from "@/components/gamification/MindMapRingNode";

interface MindMapLinksProps {
  layout: MindMapLayout;
  isOnFocusedBranch: (id: string) => boolean;
  // The single open trail (see BookMindMap.tsx's own CAFD doc comment) — needed here for the
  // exact same reason MindMapNodeCard.tsx's own `sizeScale` prop exists: a link's target isn't
  // always drawn at its node's plain 1x size (see nodeScale below), so trimming a link's
  // endpoint back to the node's real on-screen edge (see trimTowardSource) has to account for
  // that too, not just its unscaled RING_SIZE_PX/kind — otherwise an inactive (0.8x, visibly
  // smaller) node's own incoming links stop short of its real edge, leaving a gap.
  activePath: string[];
  // A pericope card's own REAL rendered width (see lib/useMindMapNodeWidths.ts) — content-sized
  // between an 80px min and 150px max, so no single fixed guess ever matches every label's own
  // real edge (see nodeHalfSize's own doc comment below). Keyed by node id; a ring/theme/root
  // node never appears here since their own fixed formula is already exact/close enough.
  pericopeWidthById: Map<string, number>;
}

// lib/mindMapTreeLayout.ts already hands back each link's own (x, y) pair for both ends —
// straight accessors, no per-link special-casing here. linkVertical (not linkRadial) draws a
// smooth vertical S-curve between a parent and each child, the standard connector shape for a
// top-down dendrogram; a pericope's own stub (see MindMapLayoutLink.straight) instead draws as a
// plain straight segment off its chapter's own trunk (see layout.spines).
const linkGenerator = linkVertical<{ source: LayoutPoint; target: LayoutPoint }, LayoutPoint>()
  .x((point) => point.x)
  .y((point) => point.y);

// Root's own fixed circle (h-20/w-20) and the theme pill both lack one single real "radius" the
// way a plain ring does — generous fixed approximations of their own typical on-screen
// half-size, not an exact measurement (a theme pill's own real range, 72-118px wide, is narrow
// enough this rarely shows). A pericope card's own real range (80-150px) is wide enough that no
// single fixed guess works for both ends of it — see PERICOPE_HALF_SIZE_PX_FALLBACK below.
const ROOT_HALF_SIZE_PX = 40;
const THEME_PILL_HALF_SIZE_PX = 45;
// Used ONLY before a pericope card's own real width has been measured yet (see
// lib/useMindMapNodeWidths.ts) — a generous max-w-[150px]-sized guess so that one frame
// trims a bit too FAR back (a small gap) rather than not far enough (the line showing through
// the card's own dimmed 25% opacity), the safer of the two failure modes for a single frame.
const PERICOPE_HALF_SIZE_PX_FALLBACK = 75;

// A node's own approximate half-size — how far its own edge sits from its (x, y) center — used
// below to pull a link's own target point back from the dead center of a node to just short of
// its edge. A pericope card's own REAL measured width (see pericopeWidthById) is used when
// available — its 80-150px content-sized range is too wide for one fixed guess to ever match
// every label's own real edge, unlike a plain ring (one real, exact radius) or CAFD's own
// active/inactive size swing (handled separately, see nodeScale below).
function nodeHalfSize(data: MindMapDatum, pericopeWidthById: Map<string, number>): number {
  if (data.kind === "root") return ROOT_HALF_SIZE_PX;
  if (data.kind === "pericope") return (pericopeWidthById.get(data.id) ?? PERICOPE_HALF_SIZE_PX_FALLBACK * 2) / 2;
  if (data.kind === "theme") return THEME_PILL_HALF_SIZE_PX;
  return RING_SIZE_PX[data.kind] / 2;
}

// Mirrors MindMapNodeCard.tsx's own `sizeScale` prop exactly (root always 1x, a pericope by its
// own `status`, everything else by whether it's on the open trail) — see this file's own
// `activePath` doc comment above on why a link's target trim needs to match it.
function nodeScale(data: MindMapDatum, activePath: string[]): number {
  if (data.kind === "root") return 1;
  if (data.kind === "pericope") return data.status === "active" ? 1 : INACTIVE_SCALE;
  return activePath.includes(data.id) ? ACTIVE_SCALE : INACTIVE_SCALE;
}

// Pulls `target` back toward `source` by `distance` pixels along their own straight line — used
// so a link's drawn endpoint stops just short of the node it leads into rather than running all
// the way to its exact center. A dimmed node (see BookMindMap.tsx's own CAFD) renders at only
// 25% opacity, so a line that reached all the way to its center used to visibly show straight
// through the middle of the card instead of appearing to simply stop at its edge the way it does
// for a fully-opaque node — trimming the endpoint fixes that regardless of the target's own
// current opacity. Falls back to the untrimmed point for a same-position source/target (the
// direction vector has no length to pull back along) — shouldn't normally happen.
function trimTowardSource(source: LayoutPoint, target: LayoutPoint, distance: number): LayoutPoint {
  const dx = target.x - source.x;
  const dy = target.y - source.y;
  const length = Math.hypot(dx, dy);
  if (length <= distance) return target;
  const ratio = distance / length;
  return { x: target.x - dx * ratio, y: target.y - dy * ratio };
}

// The canvas's own connector SVG — every ordinary parent/child curve, plus a chapter's own
// pericope trunk-and-stubs (see lib/mindMapTreeLayout.ts's own placePericopes) — split out of
// BookMindMap.tsx purely to keep that file under this codebase's own 200-line file cap (see
// CLAUDE.md), no behavior difference from having it inline there.
export function MindMapLinks({ layout, isOnFocusedBranch, activePath, pericopeWidthById }: MindMapLinksProps) {
  const dataById = new Map(layout.nodes.map((node) => [node.data.id, node.data]));

  return (
    <svg width={layout.width} height={layout.height} className="absolute inset-0">
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
      {layout.links.map((link, index) => {
        const targetData = dataById.get(link.targetId);
        const target = targetData
          ? trimTowardSource(link.source, link.target, nodeHalfSize(targetData, pericopeWidthById) * nodeScale(targetData, activePath))
          : link.target;
        return (
          <path
            key={index}
            d={link.straight ? `M${link.source.x},${link.source.y}L${target.x},${target.y}` : (linkGenerator({ source: link.source, target }) ?? undefined)}
            fill="none"
            strokeWidth={2}
            // A link dims exactly when the node it leads INTO isn't on the focused branch — see
            // BookMindMap.tsx's own top doc comment on CAFD / isOnFocusedBranch.
            className={`${LINK_STROKE_CLASS} transition-opacity duration-300 ${isOnFocusedBranch(link.targetId) ? "opacity-100" : "opacity-25"}`}
          />
        );
      })}
    </svg>
  );
}
