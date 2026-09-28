import type { MemorizationDay } from "@/types";
import { buildPathZones } from "@/lib/pathZones";
import { computeZoneCardState } from "@/lib/pericopeCardState";
import { buildPericopeDatum, type MindMapChapterDatum } from "@/lib/mindMapHierarchy";
import { placePericopes } from "@/lib/mindMapPericopeSpine";
import type { MindMapLayoutNode, MindMapSpine, MindMapVerseChip } from "@/lib/mindMapLayoutTypes";

export interface VerseSpotlightLayout {
  // In chapter order — lib/verseSpotlightTargets.ts walks this array to find a pericope's own
  // neighbor when the target verse sits at its first/last verse (see that file's own doc
  // comment on the confirmed "spill into the neighboring pericope" boundary rule).
  pericopes: MindMapChapterDatum["children"];
  nodes: MindMapLayoutNode[];
  spine: MindMapSpine | undefined;
  verseChips: MindMapVerseChip[];
}

// The Learn flow's own compact Mind Map spotlight (components/gamification/
// LearnMindMapSpotlight.tsx) needs exactly one chapter's worth of positioned pericope/verse-chip
// data — never the whole book/canon tree lib/mindMapHierarchy.ts's buildMindMapTree walks. A
// chapter's own pericope zones are a pure, per-chapter computation with no network dependency of
// their own (see lib/useMindMapData.ts's identical `zones`/`states` derivation, lines 142-147) —
// `chapterDays` is already fully resident in LearnSection.tsx's own props (via
// lib/chapterScopedDays.ts, the same scoping useChapterReadingLayout itself already uses), so
// this never needs a fetch or a loading state, unlike the real Mind Map screen.
//
// Reuses `buildPericopeDatum` (lib/mindMapHierarchy.ts) so a pericope reads identically here and
// on the real canvas, and `placePericopes` (lib/mindMapPericopeSpine.ts) so the winding-spine
// geometry (pericope wave offset, verse-chip trail) is pixel-identical too — only the SCOPE
// (one chapter, not a whole tree) differs from BookMindMap.tsx's own call path.
export function buildVerseSpotlightLayout(
  bookName: string,
  chapterNumber: number,
  chapterDays: MemorizationDay[],
  completedDays: number,
  todaysDay: number,
): VerseSpotlightLayout {
  const zones = buildPathZones(chapterDays);
  const pericopes: MindMapChapterDatum["children"] = zones.map((zone) =>
    buildPericopeDatum(bookName, chapterNumber, zone, computeZoneCardState(zone, completedDays, todaysDay), completedDays, todaysDay),
  );

  const chapterDatum: MindMapChapterDatum = {
    kind: "chapter",
    id: `chapter:${bookName}:${chapterNumber}`,
    label: `${chapterNumber}`,
    book: bookName,
    chapter: chapterNumber,
    status: "active",
    children: pericopes,
  };

  const nodes: MindMapLayoutNode[] = [];
  const spines: MindMapSpine[] = [];
  const verseChips: MindMapVerseChip[] = [];
  placePericopes(chapterDatum, 0, 0, 0, pericopes, nodes, spines, verseChips, { minX: 0, maxX: 0, maxY: 0 });

  return { pericopes, nodes, spine: spines[0], verseChips };
}
