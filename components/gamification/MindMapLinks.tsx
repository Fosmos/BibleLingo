import { linkVertical } from "d3-shape";
import type { LayoutPoint, MindMapLayout } from "@/lib/mindMapTreeLayout";
import type { MindMapDatum } from "@/lib/mindMapHierarchy";
import { LINK_STROKE_CLASS } from "@/lib/mindMapGenreColor";
import { RING_SIZE_PX } from "@/components/gamification/MindMapRingNode";

interface MindMapLinksProps {
  layout: MindMapLayout;
  isOnFocusedBranch: (id: string) => boolean;
}

// lib/mindMapTreeLayout.ts already hands back each link's own (x, y) pair for both ends —
// straight accessors, no per-link special-casing here. linkVertical (not linkRadial) draws a
// smooth vertical S-curve between a parent and each child, the standard connector shape for a
// top-down dendrogram; a pericope's own stub (see MindMapLayoutLink.straight) instead draws as a
// plain straight segment off its chapter's own trunk (see layout.spines).
const linkGenerator = linkVertical<{ source: LayoutPoint; target: LayoutPoint }, LayoutPoint>()
  .x((point) => point.x)
  .y((point) => point.y);

// Root's own fixed circle (h-20/w-20) and the two variable-width shapes (a pericope card, a
// theme pill) all lack one single real "radius" the way a plain ring does — these are generous
// fixed approximations of their own typical on-screen half-size, not an exact measurement.
const ROOT_HALF_SIZE_PX = 40;
const PERICOPE_HALF_SIZE_PX = 40;
const THEME_PILL_HALF_SIZE_PX = 45;

// A node's own approximate half-size — how far its own edge sits from its (x, y) center — used
// below to pull a link's own target point back from the dead center of a node to just short of
// its edge. Deliberately approximate (ring nodes are the only kind with one real, exact radius;
// CAFD's own active/inactive size swing isn't accounted for either) rather than a true runtime
// measurement — same "generous fixed assumption" convention lib/mindMapTreeLayout.ts's own
// spacing constants already follow.
function nodeHalfSize(kind: MindMapDatum["kind"]): number {
  if (kind === "root") return ROOT_HALF_SIZE_PX;
  if (kind === "pericope") return PERICOPE_HALF_SIZE_PX;
  if (kind === "theme") return THEME_PILL_HALF_SIZE_PX;
  return RING_SIZE_PX[kind] / 2;
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
export function MindMapLinks({ layout, isOnFocusedBranch }: MindMapLinksProps) {
  const kindById = new Map(layout.nodes.map((node) => [node.data.id, node.data.kind]));

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
        const targetKind = kindById.get(link.targetId);
        const target = targetKind ? trimTowardSource(link.source, link.target, nodeHalfSize(targetKind)) : link.target;
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
