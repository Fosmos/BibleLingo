import type { MindMapBookDatum, MindMapDatum } from "@/lib/mindMapHierarchy";

// Two rings out from the book (Book -> Chapter -> Pericope) — requested range for ring
// spacing was 120-150px; RADIUS_STEP is the FLOOR each ring sits at, not its fixed distance —
// see chapterRadius below for why the chapter ring specifically has to grow past it.
const RADIUS_STEP = 140;
// Every chapter circle gets at least this many px of arc between it and its neighbor —
// comfortably bigger than a chapter circle's own ~56px footprint (see MindMapNodeCard.tsx's
// fixed h-14/w-14) so neighboring circles never physically overlap. A FIXED chapter radius
// (the original version of this constant) only has enough circumference for this at small
// chapter counts — 16 equally-spaced chapters at a 140px radius are already tighter than the
// circles themselves, which is exactly what packed Mark's own chapter ring shoulder to
// shoulder; see chapterRadius below for the fix.
const MIN_CHAPTER_ARC = 80;
// Every pericope on an expanded chapter's own fan gets at least this many px of arc between
// it and its neighbor — requested range was 60-80px; kept comfortably above a pericope card's
// own ~80px footprint (see MindMapNodeCard.tsx's fixed w-20) so cards never physically
// overlap even though their center points are what this constant actually governs.
const MIN_LEAF_ARC = 130;
// The widest a single chapter's own pericope fan is ever allowed to spread, centered on that
// chapter's own angle — MUST stay under π (180°) or a fan could wrap back past its own sides
// and read as belonging to a neighboring chapter instead. Comfortably under that, not just
// technically under it, so a fan never reads as pointing back toward the book at center.
const MAX_FAN_RADIANS = Math.PI * 0.7;
// Half the book node's own on-screen size (see MindMapNodeCard.tsx's h-20 circle) — every
// chapter's own connector starts this far out from center, not from the book's exact middle.
const BOOK_VISUAL_RADIUS = 40;

export interface PolarPoint {
  angle: number;
  radius: number;
}

export interface MindMapLayoutNode {
  data: MindMapDatum;
  cx: number;
  cy: number;
}

export interface MindMapLayoutLink {
  source: PolarPoint;
  target: PolarPoint;
}

export interface MindMapLayout {
  nodes: MindMapLayoutNode[];
  links: MindMapLayoutLink[];
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}

// Explicit, fixed two-ring placement — NOT d3-hierarchy's own automatic proportional-by-leaf-
// count angle partitioning (an earlier version of this file used d3's tree() layout directly).
// That automatic approach reads fine with many top-level branches (a 16-chapter book): each
// chapter's own pericopes stay confined to a small slice, proportional to how few OTHER
// chapters there are to share the circle with. But it breaks hard for a short book like Jude,
// which has exactly ONE chapter: with no sibling chapters to share the circle with, a
// proportional algorithm legitimately hands that one chapter's own pericopes the ENTIRE 2π
// budget, scattering some of them past the book node's own position — visually "above" or
// "behind" the very chapter that owns them. Fixed placement sidesteps the whole class of bug:
// every chapter ALWAYS gets an equal slot (2π / chapter count) purely for its own position,
// regardless of expansion state or pericope count; an expanded chapter's own pericopes then
// fan out independently, centered on that chapter's own angle, capped at MAX_FAN_RADIANS so
// they can never wrap back past their own parent's sides — growing the RING RADIUS instead of
// the angle when MIN_LEAF_ARC spacing wouldn't otherwise fit that many pericopes inside the
// cap. d3-shape's linkRadial (see BookMindMap.tsx) still draws the actual connector curves
// from the (angle, radius) pairs this produces.
export function computeMindMapLayout(root: MindMapBookDatum, expandedChapters: ReadonlySet<string>): MindMapLayout {
  const nodes: MindMapLayoutNode[] = [];
  const links: MindMapLayoutLink[] = [];
  let maxRadius = 0;

  function place(data: MindMapDatum, angle: number, radius: number): void {
    // `angle - π/2` rotates the whole tree so angle 0 points straight up rather than right,
    // matching a reader's instinct for "the book sits at the top."
    nodes.push({ data, cx: radius * Math.cos(angle - Math.PI / 2), cy: radius * Math.sin(angle - Math.PI / 2) });
    maxRadius = Math.max(maxRadius, radius);
  }

  place(root, 0, 0);

  const chapterCount = Math.max(1, root.children.length);
  const chapterStep = (2 * Math.PI) / chapterCount;
  // Same reasoning as the pericope ring below, one level up: `chapterCount` equally-spaced
  // circles need at least MIN_CHAPTER_ARC px of arc each, which floors how far out the whole
  // ring has to sit — 16 chapters need roughly 16 * 80 / 2π ≈ 200px, well past the 140px
  // RADIUS_STEP floor that was fine for a 3-chapter book but packed Mark's own 16 shoulder to
  // shoulder.
  const chapterRadius = Math.max(RADIUS_STEP, (chapterCount * MIN_CHAPTER_ARC) / (2 * Math.PI));
  const pericopeBaseRadius = chapterRadius + RADIUS_STEP;

  root.children.forEach((chapter, chapterIndex) => {
    const chapterAngle = chapterIndex * chapterStep;
    place(chapter, chapterAngle, chapterRadius);
    links.push({ source: { angle: chapterAngle, radius: BOOK_VISUAL_RADIUS }, target: { angle: chapterAngle, radius: chapterRadius } });

    if (!expandedChapters.has(chapter.id) || chapter.children.length === 0) return;

    const pericopes = chapter.children;
    const count = pericopes.length;
    // Angular width MIN_LEAF_ARC spacing needs at the base radius, for `count` points spread
    // across `count - 1` gaps (a lone pericope needs no gap, and no fan width, at all).
    const neededWidth = count > 1 ? ((count - 1) * MIN_LEAF_ARC) / pericopeBaseRadius : 0;
    const fanWidth = Math.min(neededWidth, MAX_FAN_RADIANS);
    // The angular width itself never grows past MAX_FAN_RADIANS — when that many pericopes
    // wouldn't fit MIN_LEAF_ARC apart within it at the base radius, the ring moves further
    // out instead until they do.
    const pericopeRadius = neededWidth > MAX_FAN_RADIANS ? ((count - 1) * MIN_LEAF_ARC) / fanWidth : pericopeBaseRadius;

    pericopes.forEach((pericope, pericopeIndex) => {
      const pericopeAngle = count === 1 ? chapterAngle : chapterAngle - fanWidth / 2 + (fanWidth * pericopeIndex) / (count - 1);
      place(pericope, pericopeAngle, pericopeRadius);
      links.push({ source: { angle: chapterAngle, radius: chapterRadius }, target: { angle: pericopeAngle, radius: pericopeRadius } });
    });
  });

  const size = maxRadius * 2 + 200; // padding so the outermost ring's own card never clips
  const center = size / 2;
  for (const node of nodes) {
    node.cx += center;
    node.cy += center;
  }

  return { nodes, links, width: size, height: size, centerX: center, centerY: center };
}
