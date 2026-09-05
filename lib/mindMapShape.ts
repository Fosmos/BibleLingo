// The Mind Map's own book/chapter/pericope SHAPE — where a chapter sits relative to the
// book, where its pericopes fan out to once expanded, and the tapered-wedge path style used
// to connect them. Split out of lib/mindMapLayout.ts (which keeps the camera/viewport
// algebra) purely to stay under this codebase's 200-line-per-file cap.

import { CHAPTER_PILL_WIDTH, CHAPTER_PILL_HEIGHT, PERICOPE_PILL_WIDTH, PERICOPE_PILL_HEIGHT, type Point } from "@/lib/mindMapLayout";

// Which of the four branches off the book a chapter sits on — a classic mind map's own
// shape: most chapters stack vertically in a column to the right and left of the book (read
// top to bottom within their own column), with just the very first and last chapter (once
// there are enough to make a column crowded) breaking out to sit directly above/below the
// book instead, for a bit of visual variety rather than two rigid straight lines of nodes.
export type ChapterSide = "left" | "right" | "top" | "bottom";

const CHAPTER_COLUMN_X = 280;
const CHAPTER_ROW_SPACING = 76;
const CHAPTER_OUTLIER_Y = 230;
// Beyond this many chapters, the column would read as one unbroken wall of pills — peeling
// the first and last off to top/bottom is what actually produces "some spots above and
// below" rather than just two long straight lists.
const OUTLIER_THRESHOLD = 8;

const PERICOPE_BRANCH_OFFSET = 170;
// A right/left chapter's own branch stacks pericopes VERTICALLY (pill height matters), a
// top/bottom chapter's stacks them HORIZONTALLY (pill width matters, and a pericope pill is
// wider than it is tall) — using the same spacing for both would let a top/bottom chapter's
// wide pills overlap each other even though a right/left chapter's own spacing is perfectly
// fine for its own (narrower) axis.
const PERICOPE_ROW_SPACING = 50;
const PERICOPE_COLUMN_SPACING = 104;

// Half the diagonal of a pill, plus a visual margin — the bounding-circle radius
// resolveOverlaps keeps clear between every pair of same-kind nodes. Using the diagonal
// (not just half the width) means two circles never touching also guarantees the actual
// pill rectangles never touch.
function collisionRadius(width: number, height: number): number {
  return Math.hypot(width, height) / 2 + 10;
}

const CHAPTER_COLLISION_RADIUS = collisionRadius(CHAPTER_PILL_WIDTH, CHAPTER_PILL_HEIGHT);
const PERICOPE_COLLISION_RADIUS = collisionRadius(PERICOPE_PILL_WIDTH, PERICOPE_PILL_HEIGHT);

// Nudges any pair of points still closer together than `minDistance` directly apart along
// the line between them, split evenly between the two — repeated a fixed number of times
// (way more than this handful of nodes ever needs to settle) so a three-way pileup resolves
// too, not just isolated pairs. A deterministic, non-physics "just make room" relaxation —
// there's no simulation to run to a stable equilibrium, just enough passes that nothing is
// still overlapping by the end. Generic over T so it works on plain points and on points
// carrying extra fields (e.g. a chapter's own side) without the caller losing them.
function resolveOverlaps<T extends Point>(points: T[], minDistance: number): T[] {
  const resolved = points.map((point) => ({ ...point }));
  for (let pass = 0; pass < 12; pass++) {
    for (let i = 0; i < resolved.length; i++) {
      for (let j = i + 1; j < resolved.length; j++) {
        const dx = resolved[j].x - resolved[i].x;
        const dy = resolved[j].y - resolved[i].y;
        const distance = Math.hypot(dx, dy) || 0.01;
        if (distance >= minDistance) continue;
        const push = (minDistance - distance) / 2;
        const unitX = dx / distance;
        const unitY = dy / distance;
        resolved[i].x -= unitX * push;
        resolved[i].y -= unitY * push;
        resolved[j].x += unitX * push;
        resolved[j].y += unitY * push;
      }
    }
  }
  return resolved;
}

// Which side each chapter (by index in reading order) lands on — see ChapterSide above.
export function assignChapterSides(count: number): ChapterSide[] {
  if (count <= 0) return [];
  const sides = new Array<ChapterSide>(count);
  const hasOutliers = count > OUTLIER_THRESHOLD;
  if (hasOutliers) {
    sides[0] = "top";
    sides[count - 1] = "bottom";
  }
  const start = hasOutliers ? 1 : 0;
  const end = hasOutliers ? count - 1 : count;
  const rightCount = Math.ceil((end - start) / 2);
  for (let i = start; i < end; i++) {
    sides[i] = i - start < rightCount ? "right" : "left";
  }
  return sides;
}

export interface ChapterPosition extends Point {
  side: ChapterSide;
}

// Lays out every chapter in the classic two-column (plus rare top/bottom outlier) mind map
// shape described above, then runs resolveOverlaps as a safety net so a long column on a
// many-chapter book still never seats two chapter pills on top of each other.
export function bookMapLayout(count: number): ChapterPosition[] {
  if (count <= 0) return [];
  const sides = assignChapterSides(count);
  const rightIndices = sides.reduce<number[]>((acc, side, index) => (side === "right" ? [...acc, index] : acc), []);
  const leftIndices = sides.reduce<number[]>((acc, side, index) => (side === "left" ? [...acc, index] : acc), []);

  function columnY(positionInColumn: number, columnSize: number): number {
    return (positionInColumn - (columnSize - 1) / 2) * CHAPTER_ROW_SPACING;
  }

  const positions: ChapterPosition[] = sides.map((side, index) => {
    if (side === "top") return { x: 0, y: -CHAPTER_OUTLIER_Y, side };
    if (side === "bottom") return { x: 0, y: CHAPTER_OUTLIER_Y, side };
    if (side === "right") return { x: CHAPTER_COLUMN_X, y: columnY(rightIndices.indexOf(index), rightIndices.length), side };
    return { x: -CHAPTER_COLUMN_X, y: columnY(leftIndices.indexOf(index), leftIndices.length), side };
  });

  return resolveOverlaps(positions, CHAPTER_COLLISION_RADIUS * 2);
}

// One chapter's own pericope branch: `count` points stacked along the same direction that
// chapter already sits from the book (further right for a "right" chapter, further left for
// "left", further up for "top", further down for "bottom") — so expanding a chapter reads as
// its branch continuing outward, not sprouting in some unrelated direction.
export function pericopeBranchLayout(chapterPosition: Point, side: ChapterSide, count: number): Point[] {
  if (count <= 0) return [];
  const verticalRow = (index: number) => (index - (count - 1) / 2) * PERICOPE_ROW_SPACING;
  const horizontalRow = (index: number) => (index - (count - 1) / 2) * PERICOPE_COLUMN_SPACING;
  let positions: Point[];
  if (side === "right") {
    positions = Array.from({ length: count }, (_, i) => ({ x: chapterPosition.x + PERICOPE_BRANCH_OFFSET, y: chapterPosition.y + verticalRow(i) }));
  } else if (side === "left") {
    positions = Array.from({ length: count }, (_, i) => ({ x: chapterPosition.x - PERICOPE_BRANCH_OFFSET, y: chapterPosition.y + verticalRow(i) }));
  } else if (side === "top") {
    positions = Array.from({ length: count }, (_, i) => ({ x: chapterPosition.x + horizontalRow(i), y: chapterPosition.y - PERICOPE_BRANCH_OFFSET }));
  } else {
    positions = Array.from({ length: count }, (_, i) => ({ x: chapterPosition.x + horizontalRow(i), y: chapterPosition.y + PERICOPE_BRANCH_OFFSET }));
  }
  return resolveOverlaps(positions, PERICOPE_COLLISION_RADIUS * 2);
}

// A branch from `start` (the book, or a chapter) to `end` (a chapter, or one of its
// pericopes) that leaves already angled toward the target's own row, then levels out into a
// flat, straight run for its final approach — a cubic Bezier whose first control point sits
// early along the line but already at `end`'s own y (so the curve heads toward the target's
// height right away, reading as "curved" rather than a plain diagonal) and whose second
// control point sits later along the line, also at `end`'s y (so the tangent arriving at
// `end` is exactly horizontal — "goes straight to it" once it's reached that row). A
// top/bottom chapter shares the book's own x, so this naturally collapses to a plain
// vertical line for those — nothing left to curve around.
export function elbowCurvePath(start: Point, end: Point): string {
  const dx = end.x - start.x;
  const control1 = { x: start.x + dx * 0.25, y: end.y };
  const control2 = { x: start.x + dx * 0.75, y: end.y };
  return `M ${start.x} ${start.y} C ${control1.x} ${control1.y}, ${control2.x} ${control2.y}, ${end.x} ${end.y}`;
}

// A plain greedy word-wrap — splits `text` into lines that each stay within
// `maxCharsPerLine`, breaking on whitespace only (never mid-word). Used to fit the book
// circle's own full title (see lib/bibleBookTitles.ts) across a few centered lines instead
// of one line spilling out past the circle's own edge.
export function wrapLabel(text: string, maxCharsPerLine: number): string[] {
  const lines: string[] = [];
  let current = "";
  for (const word of text.split(" ")) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxCharsPerLine && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}
