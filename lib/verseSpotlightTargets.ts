import type { MindMapPericopeDatum } from "@/lib/mindMapHierarchy";
import type { LayoutPoint, MindMapVerseChip } from "@/lib/mindMapLayoutTypes";

export interface VerseSpotlightTargets {
  current: LayoutPoint;
  // The node immediately before/after the current verse — undefined only at the outer edge of
  // this chapter's own pericope list (the chapter's very first/last pericope), where there's no
  // neighboring pericope left to spill into. Never crosses a CHAPTER boundary — the spotlight
  // only ever has this one chapter's own data in hand (see lib/learnVerseSpotlightLayout.ts).
  before: LayoutPoint | undefined;
  after: LayoutPoint | undefined;
}

function chipFor(verseChips: MindMapVerseChip[], pericopeId: string, verseNumber: number): LayoutPoint | undefined {
  return verseChips.find((chip) => chip.pericopeId === pericopeId && chip.verseNumber === verseNumber);
}

// Resolves the current verse's own on-canvas point, plus its immediate before/after neighbors —
// confirmed "spill into the neighboring pericope" boundary rule: normally the same pericope's
// adjacent verse chip, but when the target verse is its own pericope's first/last verse, the
// neighboring pericope's own last/first verse chip instead, so there's always something in frame
// on both sides except at the chapter's own outer edge. `pericopes` must be in chapter order
// (see lib/learnVerseSpotlightLayout.ts's own `pericopes`, built straight from `buildPathZones`,
// which already returns zones in chapter order).
export function findSpotlightTargets(
  pericopes: MindMapPericopeDatum[],
  verseChips: MindMapVerseChip[],
  targetPericopeId: string,
  targetVerseNumber: number,
): VerseSpotlightTargets | undefined {
  const current = chipFor(verseChips, targetPericopeId, targetVerseNumber);
  if (!current) return undefined;

  const index = pericopes.findIndex((pericope) => pericope.id === targetPericopeId);
  const pericope = pericopes[index];
  if (!pericope) return { current, before: undefined, after: undefined };

  const { rangeStartVerse, rangeEndVerse } = pericope;
  const atFirstVerse = rangeStartVerse !== undefined && targetVerseNumber <= rangeStartVerse;
  const atLastVerse = rangeEndVerse !== undefined && targetVerseNumber >= rangeEndVerse;

  const before = atFirstVerse
    ? spillPoint(verseChips, pericopes[index - 1], "last")
    : chipFor(verseChips, targetPericopeId, targetVerseNumber - 1);
  const after = atLastVerse
    ? spillPoint(verseChips, pericopes[index + 1], "first")
    : chipFor(verseChips, targetPericopeId, targetVerseNumber + 1);

  return { current, before, after };
}

// The neighboring pericope's own first or last verse chip — "last" for a "before" spill (the
// PREVIOUS pericope's own closing verse), "first" for an "after" spill (the NEXT pericope's own
// opening verse).
function spillPoint(verseChips: MindMapVerseChip[], neighbor: MindMapPericopeDatum | undefined, end: "first" | "last"): LayoutPoint | undefined {
  if (!neighbor) return undefined;
  const verseNumber = end === "first" ? neighbor.rangeStartVerse : neighbor.rangeEndVerse;
  if (verseNumber === undefined) return undefined;
  return chipFor(verseChips, neighbor.id, verseNumber);
}
