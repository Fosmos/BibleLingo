import type { MindMapDatum, MindMapPericopeDatum } from "@/lib/mindMapHierarchy";

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
  // A pericope's own 1-based ordinal among its chapter's siblings, in placement order (see
  // lib/mindMapTreeLayout.ts's own placePericopes) — the "Hall {n}" plaque number
  // MindMapPericopeGateway.tsx shows. Undefined for every other kind.
  hallNumber?: number;
  // A hall's landmark position, beside its verses (see lib/mindMapHallGeometry.ts's
  // hallEmblemPoint). Only on a pericope whose verses are laid out.
  emblem?: LayoutPoint & { size: number };
}

export interface MindMapLayoutLink {
  source: LayoutPoint;
  target: LayoutPoint;
  // The target node's own id — lets a caller (see BookMindMap.tsx's own CAFD dimming) decide a
  // link's opacity by whether it leads somewhere currently on the single active branch, without
  // re-deriving that from raw (x, y) coordinates.
  targetId: string;
}

// One point along a chapter's own spine — a plain (x, y) plus whether the reader has actually
// reached/finished whatever this point represents (a chapter start, a pericope, a single verse).
// See lib/mindMapPericopeSpine.ts's own placePericopes for how each kind of point resolves this.
export interface SpinePoint extends LayoutPoint {
  completed: boolean;
  // The hall this point belongs to's own path colour (see lib/mindMapGenreColor.ts's
  // hallPathStroke) — the stretch of path INTO this point is drawn in it, so the corridor changes
  // colour hall by hall. Undefined for the chapter's own starting point.
  stroke?: string;
  // Set on a hall card's own point — which hall it is, so its gate can be placed where the path
  // arrives at the card (see MindMapLinks.tsx).
  hallId?: string;
}

// One chapter's own winding spine — a single continuous sequence of points from the chapter's
// own center down through every one of its pericopes' own points, in order (see
// lib/mindMapTreeLayout.ts's own placePericopes). Drawn separately from `links` since it belongs
// to no single (parent, child) pair. MindMapLinks.tsx draws each CONSECUTIVE pair of points as
// its own short segment (not one single path) — `completed` on the earlier point of a pair
// decides whether that one segment renders dashed (not yet reached) or solid (already learned),
// so the line itself tracks real progress rather than a uniform "chapter is open" dotted style.
export interface MindMapSpine {
  points: SpinePoint[];
  // The chapter node this spine hangs from — lets a caller color it the same way a link's own
  // targetId does (see BookMindMap.tsx's own CAFD dimming).
  parentId: string;
}

// One verse chip along a pericope's own stretch of the spine (see
// lib/mindMapTreeLayout.ts's own placePericopes/lib/mindMapVerseStream.ts) — strung directly
// below that pericope's own card, in real verse order, continuing on to wherever the NEXT
// pericope's card ends up (pushed down to clear room for them — see MindMapPericopeGateway.tsx).
// Not a MindMapLayoutNode: a verse chip isn't a real tree node (no MindMapDatum of its own,
// never dims/joins CAFD), just a point on the same shared spine curve.
export interface MindMapVerseChip extends LayoutPoint {
  verseNumber: number;
  // Its circle's diameter — sized by how long the verse is (see lib/mindMapHallGeometry.ts).
  size: number;
  // Which pericope this chip belongs to — every pericope under an open chapter unrolls its own
  // verses at once now (see placePericopes), so BookMindMap.tsx groups `layout.verseChips` back
  // out by this id to hand each MindMapVerseStream instance only its own pericope's own chips.
  pericopeId: string;
}

export interface MindMapLayout {
  nodes: MindMapLayoutNode[];
  links: MindMapLayoutLink[];
  spines: MindMapSpine[];
  verseChips: MindMapVerseChip[];
  width: number;
  height: number;
}

// A type-predicate narrower for `layout.nodes.filter(...)` — BookMindMap.tsx needs the real
// MindMapPericopeDatum fields (book, chapter, startVerse, ...) back out after filtering to just
// the pericope kind, which a plain `.filter(n => n.data.kind === "pericope")` doesn't narrow on
// its own (TS control-flow analysis doesn't see through an arbitrary callback).
export function isPericopeNode(node: MindMapLayoutNode): node is MindMapLayoutNode & { data: MindMapPericopeDatum } {
  return node.data.kind === "pericope";
}
