import type { MindMapDatum } from "@/lib/mindMapHierarchy";

// The Mind Map canvas's own computed pixel geometry — split out of lib/mindMapTreeLayout.ts
// (which computes real layouts of this shape) purely to keep both files under this codebase's
// own 200-line cap (see CLAUDE.md).

export interface LayoutPoint {
  x: number;
  y: number;
}

export interface MindMapLayoutNode {
  data: MindMapDatum;
  cx: number;
  cy: number;
}

export interface MindMapLayoutLink {
  source: LayoutPoint;
  target: LayoutPoint;
  // The target node's own id — lets a caller (see BookMindMap.tsx's own CAFD dimming) decide a
  // link's opacity by whether it leads somewhere currently on the single active branch, without
  // re-deriving that from raw (x, y) coordinates.
  targetId: string;
  // True for a pericope's own short horizontal connector stub (see
  // lib/mindMapTreeLayout.ts's own placePericopes) — the caller draws these as a plain straight
  // segment rather than the smooth S-curve d3-shape's linkVertical draws for every other
  // (parent, child) pair, since a stub connects a point ON the trunk to its own pericope at the
  // SAME y, not a parent node down to a child row.
  straight?: boolean;
}

// One chapter's own vertical trunk line — the spine every one of its pericopes' own stubs (see
// MindMapLayoutLink.straight) branches off of. Drawn separately from `links` since it belongs to
// no single (parent, child) pair; it's the whole column.
export interface MindMapSpine {
  x: number;
  y0: number;
  y1: number;
  // The chapter node this trunk hangs from — lets a caller color it the same way a link's own
  // targetId does (see BookMindMap.tsx's own CAFD dimming).
  parentId: string;
}

export interface MindMapLayout {
  nodes: MindMapLayoutNode[];
  links: MindMapLayoutLink[];
  spines: MindMapSpine[];
  width: number;
  height: number;
}
