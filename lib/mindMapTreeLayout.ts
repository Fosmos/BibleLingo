import type { MindMapDatum, MindMapRootDatum } from "@/lib/mindMapHierarchy";
import type { MindMapLayoutNode, MindMapLayoutLink, MindMapSpine, MindMapVerseChip, MindMapLayout } from "@/lib/mindMapLayoutTypes";
import { placePericopes, type PericopeSpineBounds } from "@/lib/mindMapPericopeSpine";

export type { LayoutPoint, MindMapLayoutNode, MindMapLayoutLink, MindMapSpine, MindMapVerseChip, MindMapLayout } from "@/lib/mindMapLayoutTypes";

// Horizontal room reserved per sibling slot — covers every FIXED-size node card's own real
// footprint (pericopes are content-sized and don't use this — see PERICOPE_STEP_PX below).
// Every set of siblings gets EQUAL spacing regardless of whether one happens to be deeply
// expanded — deliberately NOT proportional to subtree size (an earlier dendrogram version let
// expanding one branch shove later siblings sideways); fixed spacing keeps a sibling's own
// position tied purely to its plain order. Sized against the worst-case adjacent pair (an
// ACTIVE 72px ring at 1.2x next to an INACTIVE one at 0.8x — see lib/useMindMapFocusState.ts),
// trimmed a bit tighter than that full worst case for a denser tree.
const SIBLING_SPACING_PX = 82;
// Theme siblings render as pills sized to their own label (see MindMapRingNode.tsx's own
// `pill` prop — up to 118px wide, wider than every other ring/card's own fixed footprint the
// plain SIBLING_SPACING_PX above was sized for) — plus CAFD's own active-node grow (up to 1.2x)
// can widen one further still (active max-width pill next to an inactive one sums to ~118px of
// combined half-widths); tightened the same way as SIBLING_SPACING_PX above.
const PILL_SIBLING_SPACING_PX = 128;
// Vertical distance from a node down to its own children's row — Root, Testament, Genre, Book,
// Chapter, Pericope. Clears any single row's own node height (an active ring at 1.2x, or a
// realistically-tall first pericope card), tightened the same way as SIBLING_SPACING_PX above.
const LEVEL_HEIGHT_PX = 100;
// Once a single sibling row would hold more than this many nodes, it wraps into a roughly
// square GRID instead (see gridPosition below) — comfortably above a genuinely SHORT book's own
// chapter count (Mark's own 16, say) so those stay a plain single row, the familiar shape; it's
// specifically a long book (Genesis' 50, Psalms' 150) this exists for.
const GRID_WRAP_THRESHOLD = 20;
// Vertical gap between one wrapped grid row and the next, within the SAME depth level — smaller
// than LEVEL_HEIGHT_PX since these rows are still conceptually one level (e.g. still "the
// chapter ring"), just stacked to keep the ring from stretching into one absurdly long line.
const GRID_ROW_HEIGHT_PX = 70;
// Padding around the computed bounding box so an edge node's own card never clips against the
// canvas edge.
const CANVAS_PADDING_PX = 100;
// The root's fixed x on the canvas. Every node's place is fixed for good — the map is a memory
// palace, and a place that moves can't be remembered — so the canvas is anchored here, not to
// whatever happens to be leftmost right now (which shifted the whole map whenever a branch far to
// the left opened or closed). Comfortably wider than the whole canon ever spreads to either side.
const ORIGIN_X_PX = 3000;

// A node's own real children per lib/mindMapHierarchy.ts's own union — a pericope never has
// any; every other kind's `children` array is already the right shape (empty for an
// unexpanded/inactive branch, same convention as before).
function childrenOf(datum: MindMapDatum): MindMapDatum[] {
  return datum.kind === "pericope" ? [] : datum.children;
}

// A node's own children are only ever WALKED (and so only ever rendered/take up any sibling
// slots) once its own id is in `expandedIds` — the root is the one implicit exception, always
// considered expanded, since the canvas has to start somewhere. A node with real children that
// just hasn't been tapped open yet renders as one plain circle, the same as a true leaf —
// collapsed is collapsed, regardless of how much it's hiding.
function visibleChildren(datum: MindMapDatum, expandedIds: ReadonlySet<string>): MindMapDatum[] {
  if (datum.kind !== "root" && !expandedIds.has(datum.id)) return [];
  return childrenOf(datum);
}

// Where sibling `index` (of `count` total) sits within its own row — a single, ordinary row
// (col = index, one row) below GRID_WRAP_THRESHOLD, a roughly SQUARE grid above it: a many-
// chapter book's own chapter ring otherwise stretches into one straight line thousands of
// pixels wide (150 chapters * SIBLING_SPACING_PX), which reads as "this book expands endlessly
// sideways" rather than as a contained, ordinary part of the tree. Wrapping into ~sqrt(count)
// columns keeps the whole ring roughly as wide as it is tall instead, the same "doesn't
// dominate the canvas in one direction" property every other level already has. Chapters still
// read in plain numeric order within the grid, left to right then down a row, same as text —
// the one wrinkle is purely visual (a row break partway through), not a reordering.
function gridPosition(index: number, count: number): { col: number; row: number; columns: number } {
  if (count <= GRID_WRAP_THRESHOLD) return { col: index, row: 0, columns: count };
  const columns = Math.ceil(Math.sqrt(count));
  return { col: index % columns, row: Math.floor(index / columns), columns };
}

// Explicit, hand-rolled top-down tree placement — deliberately not d3-hierarchy's own tree()
// layout (not a dependency this app already carries; d3-shape's linkVertical below still draws
// the actual connector curves once points are placed). Each node's own children are laid out
// left-to-right directly beneath it, evenly spaced (see SIBLING_SPACING_PX above) and centered
// under their parent — a node's own position is always simply "my parent's x, plus my own
// index among my siblings times the fixed spacing," independent of anything happening
// elsewhere in the tree. Unlike the old RADIAL version this replaces, there's no "share a fixed
// circle" pitfall to design around (a lone child under a parent with no siblings just sits
// directly under that parent, the same as it would with ten siblings) — a top-down tree's
// sibling axis is already just a straight line, not a shared circumference.
// A chapter's own pericopes ALWAYS unroll every one of their own verse streams together, the
// instant that chapter itself is the open/selected one (see lib/mindMapPericopeSpine.ts's own
// placePericopes) — each one's required push-down height is a plain formula
// (lib/mindMapVerseStream.ts's verseStreamHeightPx), not a measured value, so no second pass.
export function computeMindMapLayout(root: MindMapRootDatum, expandedIds: ReadonlySet<string>): MindMapLayout {
  const nodes: MindMapLayoutNode[] = [];
  const links: MindMapLayoutLink[] = [];
  const spines: MindMapSpine[] = [];
  const verseChips: MindMapVerseChip[] = [];
  const bounds: PericopeSpineBounds = { minX: 0, maxX: 0, maxY: 0 };

  // `childrenStartY` is where THIS node's own children begin — passed down by its PARENT
  // rather than derived from this node's own y, because a wrapped grid's rows are only
  // GRID_ROW_HEIGHT_PX apart from EACH OTHER (see gridPosition), narrower than the full
  // LEVEL_HEIGHT_PX a level further down needs to stay clear of every row in that same grid —
  // a chapter sitting in, say, row 2 of an 8-row grid would otherwise have its own pericopes
  // land right on top of rows 3 and 4's own circles. Every child of the SAME sibling group
  // therefore descends from the SAME floor — the bottom of the whole grid, not each child's own
  // individual row — even though that leaves an intentionally generous gap for a child sitting
  // in an earlier row. A big gap reads as spacious; overlapping cards read as broken.
  function place(datum: MindMapDatum, x: number, y: number, childrenStartY: number): void {
    nodes.push({ data: datum, cx: x, cy: y });
    bounds.minX = Math.min(bounds.minX, x);
    bounds.maxX = Math.max(bounds.maxX, x);
    bounds.maxY = Math.max(bounds.maxY, y);

    // Always this node's own siblings in their PLAIN natural order — chapter 1 stays the
    // leftmost chapter, "The Beginning" stays the leftmost theme, and so on, whether or not one
    // of them happens to be expanded. Selecting a node reveals what's under it in place; it
    // never reshuffles its own row to center itself, so a reader's own spatial memory of where
    // a given circle sits never gets disturbed by what they tap.
    const children = visibleChildren(datum, expandedIds);
    if (children.length === 0) return;

    if (datum.kind === "chapter") {
      placePericopes(datum, x, y, childrenStartY, children, nodes, spines, verseChips, bounds);
      return;
    }

    const positions = children.map((_, index) => gridPosition(index, children.length));
    const rows = Math.max(...positions.map((position) => position.row)) + 1;
    const gridBottomY = childrenStartY + (rows - 1) * GRID_ROW_HEIGHT_PX;
    const grandchildrenStartY = gridBottomY + LEVEL_HEIGHT_PX;
    const siblingSpacing = children[0]?.kind === "theme" ? PILL_SIBLING_SPACING_PX : SIBLING_SPACING_PX;

    children.forEach((child, index) => {
      const { col, row, columns } = positions[index];
      const childX = x + (col - (columns - 1) / 2) * siblingSpacing;
      const childY = childrenStartY + row * GRID_ROW_HEIGHT_PX;
      links.push({ source: { x, y }, target: { x: childX, y: childY }, targetId: child.id });
      place(child, childX, childY, grandchildrenStartY);
    });
  }

  place(root, 0, 0, LEVEL_HEIGHT_PX);

  const offsetX = Math.max(ORIGIN_X_PX, -bounds.minX + CANVAS_PADDING_PX);
  const width = Math.max(ORIGIN_X_PX * 2, offsetX + bounds.maxX + CANVAS_PADDING_PX);
  const height = bounds.maxY + CANVAS_PADDING_PX * 2;
  const offsetY = CANVAS_PADDING_PX;
  for (const node of nodes) {
    node.cx += offsetX;
    node.cy += offsetY;
    if (node.emblem) node.emblem = { ...node.emblem, x: node.emblem.x + offsetX, y: node.emblem.y + offsetY };
  }
  for (const link of links) {
    link.source.x += offsetX;
    link.source.y += offsetY;
    link.target.x += offsetX;
    link.target.y += offsetY;
  }
  for (const spine of spines) {
    for (const point of spine.points) {
      point.x += offsetX;
      point.y += offsetY;
    }
  }
  for (const chip of verseChips) {
    chip.x += offsetX;
    chip.y += offsetY;
  }

  return { nodes, links, spines, verseChips, width, height };
}
