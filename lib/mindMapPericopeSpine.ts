import type { MindMapDatum, MindMapPericopeDatum } from "@/lib/mindMapHierarchy";
import type { MindMapLayoutNode, MindMapSpine, MindMapVerseChip } from "@/lib/mindMapLayoutTypes";
import { verseStreamNumbers, verseStreamPoints, verseStreamHeightPx, hallExtraHeightPx } from "@/lib/mindMapVerseStream";
import { isVerseLearned } from "@/lib/pericopeLearned";
import { hallPathStroke } from "@/lib/mindMapGenreColor";
import { hallEmblemPoint, seededRandom } from "@/lib/mindMapHallGeometry";

// Split out of lib/mindMapTreeLayout.ts purely to keep that file under this codebase's own
// 200-line cap (see CLAUDE.md) — no behavior difference from having it there.

// A chapter's own pericopes lay out differently from every other level — a single winding spine
// down from the chapter, each pericope wandering gently left/right off it. PERICOPE_STEP_PX is
// the flat baseline vertical distance from one pericope to the next along that spine, on TOP of
// whichever earlier pericope's own real verseStreamHeightPx (see the loop below) — kept tight
// (not a generous pause) so a pericope's own last verse chip flows straight into the next room
// rather than leaving a dead gap, the SAME "less room between the last verse and the next
// pericope" goal lib/mindMapVerseStream.ts's own VERSE_STREAM_BOTTOM_PADDING_PX also serves; the
// two combine into the real gap. Every pericope's own verse stream is ALWAYS unrolled too (see
// the loop below) — a chapter only ever gets this far in the first place once it's the
// selected/open one (see lib/mindMapTreeLayout.ts's own visibleChildren, which is the only
// caller of this function), so "this chapter is selected" and "show every one of its pericopes'
// verses" are the same moment, not two separate states. That's also why the reader is meant to
// reach every one of them by scrolling straight down — see PERICOPE_WAVE_AMPLITUDE_PX below for
// the narrow wander that keeps the whole column reachable with the vertical-only pan
// lib/useMindMapPericopeZoomLock.ts applies once a chapter is open.
const PERICOPE_STEP_PX = 36;
// How far the pericope spine itself wanders left/right of the chapter's own x — deliberately
// narrow (not the old ±80px alternation) so the WHOLE column, pericope cards and their own verse
// chains alike, stays comfortably within the locked vertical-scroll viewport's own width; a wide
// swing would put some cards outside a pan that can no longer move sideways to reach them.
// Exported so lib/useMindMapPericopeZoomLock.ts's own width-fit formula always matches the real
// spread this produces, rather than guessing at it separately.
export const PERICOPE_WAVE_AMPLITUDE_PX = 32;

// Mutable running bounding box — plain out-params (this function is called deep inside
// lib/mindMapTreeLayout.ts's own recursive `place`, which tracks the SAME box across every
// other kind of node too; threading it through here keeps one shared box rather than a second
// one this file would have to merge back in).
export interface PericopeSpineBounds {
  minX: number;
  maxX: number;
  maxY: number;
}

// A gentle sine sweep rather than the old hard left/right alternation — lib/mindMapLinks.tsx
// draws this same sequence as ONE continuous curve, not a trunk + per-pericope elbow, so a
// smoothly-wandering sequence of points is already a winding spine on its own. Pericopes are
// always leaves, so this never needs to hand back a "where do MY children start" floor the way
// lib/mindMapTreeLayout.ts's own `place` does.
//
// Every pericope's own verses string directly below its card, continuing the SAME spine curve on
// down to wherever the next pericope ends up — not a side branch (see lib/mindMapVerseStream.ts's
// own top doc comment) — pushing every LATER sibling down by that stream's own real height (a
// plain formula, not a measured value — see that file again).
export function placePericopes(
  chapter: MindMapDatum,
  x: number,
  y: number,
  startY: number,
  pericopes: MindMapDatum[],
  nodes: MindMapLayoutNode[],
  spines: MindMapSpine[],
  verseChips: MindMapVerseChip[],
  bounds: PericopeSpineBounds,
): void {
  // The very first segment (chapter center -> first pericope) has no verse/pericope of its own
  // to judge completion by — it reads "reached" the instant the chapter's own first pericope is
  // no longer locked, i.e. the reader has actually begun this chapter, not merely opened its
  // ring to look at it.
  const firstPericope = pericopes[0] as MindMapPericopeDatum | undefined;
  // Also reached once any verse of it is learned — a hall memorized from outside its lesson plan
  // (another path, a prior-known verse) can still carry a "locked" lesson status.
  const chapterStarted = firstPericope !== undefined && (firstPericope.status !== "locked" || (firstPericope.learnedVerses?.length ?? 0) > 0);
  const points: MindMapSpine["points"] = [{ x, y, completed: chapterStarted }];
  let pushDownY = 0;
  pericopes.forEach((pericope, index) => {
    const datum = pericope as MindMapPericopeDatum;
    // A hall whose heading wraps is taller — its upper half needs clearing from the hall above.
    const extraHeight = hallExtraHeightPx(datum);
    pushDownY += extraHeight / 2;
    const childY = startY + index * PERICOPE_STEP_PX + pushDownY;
    // Each hall card sits a seeded distance off the corridor's center line — varied, but fixed.
    const childX = x + PERICOPE_WAVE_AMPLITUDE_PX * (seededRandom(`${datum.book}|${datum.chapter}|${index + 1}|card`)() * 2 - 1);
    nodes.push({ data: pericope, cx: childX, cy: childY, hallNumber: index + 1 });
    bounds.minX = Math.min(bounds.minX, childX);
    bounds.maxX = Math.max(bounds.maxX, childX);
    bounds.maxY = Math.max(bounds.maxY, childY);
    const stroke = hallPathStroke(datum);
    const numbers = verseStreamNumbers(datum);
    // Each stretch of path is styled by the point it leaves from, so the hall's own point counts as
    // reached once its FIRST verse is learned — the line from the hall card into that verse turns
    // solid with it, not only when the whole hall is done.
    const reached = datum.status === "completed" || (numbers.length > 0 && isVerseLearned(datum, numbers[0]));
    points.push({ x: childX, y: childY, completed: reached, stroke, hallId: pericope.id });
    const chipOffsets = verseStreamPoints(datum, numbers, index + 1);
    const emblem = hallEmblemPoint(chipOffsets);
    if (emblem) nodes[nodes.length - 1].emblem = { x: childX + emblem.x, y: childY + emblem.y, size: emblem.size };
    for (const [verseIndex, offset] of chipOffsets.entries()) {
      const chipX = childX + offset.x;
      const chipY = childY + offset.y;
      const verseNumber = numbers[verseIndex];
      verseChips.push({ x: chipX, y: chipY, verseNumber, pericopeId: pericope.id, size: offset.size });
      bounds.minX = Math.min(bounds.minX, chipX);
      bounds.maxX = Math.max(bounds.maxX, chipX);
      bounds.maxY = Math.max(bounds.maxY, chipY);
      points.push({ x: chipX, y: chipY, completed: isVerseLearned(datum, verseNumber), stroke });
    }
    pushDownY += verseStreamHeightPx(datum, index + 1);
  });
  if (pericopes.length > 0) {
    spines.push({ points, parentId: chapter.id });
  }
}
