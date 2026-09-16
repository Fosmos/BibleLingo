import type { MindMapDatum, MindMapRootDatum } from "@/lib/mindMapHierarchy";
import type { MindMapLayoutNode, MindMapLayoutLink, MindMapSpine, MindMapLayout } from "@/lib/mindMapLayoutTypes";

export type { LayoutPoint, MindMapLayoutNode, MindMapLayoutLink, MindMapSpine, MindMapLayout } from "@/lib/mindMapLayoutTypes";

// Horizontal room reserved per sibling slot — one flat constant for the whole tree, comfortably
// covering every FIXED-size node card's own real footprint (pericopes are the one kind that
// isn't fixed-size and so don't use this — see PERICOPE_STEP_PX/PERICOPE_SIDE_OFFSET_PX below).
// Every set of siblings gets EQUAL spacing based purely on how many of them there are,
// regardless of whether one of them happens to be deeply expanded — deliberately NOT
// proportional to subtree size (an earlier version sized each child's own band by its total
// descendant leaf count, a classic dendrogram, but that let expanding just ONE branch shove
// every LATER sibling sideways by its own unrelated width); fixed spacing means expanding a
// branch only ever affects what's directly under it, every sibling's own position always stays
// exactly where its plain sibling order puts it. Sized against the LARGEST circle's own
// diameter at its ACTIVE size (testament, 72px base * ACTIVE_SCALE 1.2 — see
// lib/useMindMapFocusState.ts) next to an INACTIVE sibling (72px * 0.8), the worst-case adjacent
// pair once CAFD's own 1.5x active/inactive contrast applies (half-widths sum to ~72px) —
// trimmed a bit tighter than that full worst case for a denser, more compact tree, still
// keeping that pair clear.
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
// A chapter's own pericopes lay out differently from every other level (see placePericopes
// below) — a single vertical trunk stepping straight down from the chapter, each pericope
// alternating left/right off it. PERICOPE_STEP_PX is the vertical distance from one pericope to
// the next along that trunk; PERICOPE_SIDE_OFFSET_PX is the horizontal reach of each one's own
// short connector stub off the trunk. Pericope cards are content-sized, not fixed (see
// MindMapNodeCard.tsx — a real ESV section heading renders in full at an 11px font, never
// truncated, up to a 150px max-w), so both constants are sized against a generous worst-case
// footprint instead (a heading wrapping up to ~4 lines at that max-width/font, plus its own
// verse-range caption, comfortably under 105px tall): STEP clears a same-side neighbor two
// steps away (2 * 58 = 116px > ~105px) with real margin; OFFSET clears two opposite-side cards
// at their own worst-case half-width (2 * 80 = 160px > 150px max-w) with real margin too — both
// trimmed a bit tighter than the full worst case for a more compact tree. A genuinely
// pathological heading could still overlap its neighbor — an accepted, rare cost against ever
// silently truncating real content.
const PERICOPE_STEP_PX = 58;
const PERICOPE_SIDE_OFFSET_PX = 80;

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
export function computeMindMapLayout(root: MindMapRootDatum, expandedIds: ReadonlySet<string>): MindMapLayout {
  const nodes: MindMapLayoutNode[] = [];
  const links: MindMapLayoutLink[] = [];
  const spines: MindMapSpine[] = [];
  let minX = 0;
  let maxX = 0;
  let maxY = 0;

  // A chapter's own pericopes zig-zag straight down a single trunk directly below it, in order
  // — pericope 1 on one side, pericope 2 diagonally across from it on the other, pericope 3 back
  // to the first side, and so on — rather than the ordinary fanned-out sibling row every other
  // level uses. Pericopes are always leaves (childrenOf never recurses into them), so this never
  // needs to hand back a "where do MY children start" floor the way `place` does.
  function placePericopes(chapter: MindMapDatum, x: number, y: number, startY: number, pericopes: MindMapDatum[]): void {
    pericopes.forEach((pericope, index) => {
      const side = index % 2 === 0 ? -1 : 1;
      const childY = startY + index * PERICOPE_STEP_PX;
      const childX = x + side * PERICOPE_SIDE_OFFSET_PX;
      nodes.push({ data: pericope, cx: childX, cy: childY });
      minX = Math.min(minX, childX);
      maxX = Math.max(maxX, childX);
      maxY = Math.max(maxY, childY);
      links.push({ source: { x, y: childY }, target: { x: childX, y: childY }, targetId: pericope.id, straight: true });
    });
    if (pericopes.length > 0) {
      spines.push({ x, y0: y, y1: startY + (pericopes.length - 1) * PERICOPE_STEP_PX, parentId: chapter.id });
    }
  }

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
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);

    // Always this node's own siblings in their PLAIN natural order — chapter 1 stays the
    // leftmost chapter, "The Beginning" stays the leftmost theme, and so on, whether or not one
    // of them happens to be expanded. Selecting a node reveals what's under it in place; it
    // never reshuffles its own row to center itself, so a reader's own spatial memory of where
    // a given circle sits never gets disturbed by what they tap.
    const children = visibleChildren(datum, expandedIds);
    if (children.length === 0) return;

    if (datum.kind === "chapter") {
      placePericopes(datum, x, y, childrenStartY, children);
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

  const width = maxX - minX + CANVAS_PADDING_PX * 2;
  const height = maxY + CANVAS_PADDING_PX * 2;
  const offsetX = -minX + CANVAS_PADDING_PX;
  const offsetY = CANVAS_PADDING_PX;
  for (const node of nodes) {
    node.cx += offsetX;
    node.cy += offsetY;
  }
  for (const link of links) {
    link.source.x += offsetX;
    link.source.y += offsetY;
    link.target.x += offsetX;
    link.target.y += offsetY;
  }
  for (const spine of spines) {
    spine.x += offsetX;
    spine.y0 += offsetY;
    spine.y1 += offsetY;
  }

  return { nodes, links, spines, width, height };
}
