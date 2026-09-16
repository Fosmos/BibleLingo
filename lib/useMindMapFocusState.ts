"use client";

import { useMemo } from "react";
import type { MindMapRootDatum } from "@/lib/mindMapHierarchy";
import { activeChainIds } from "@/lib/mindMapActivePath";

export interface MindMapFocusState {
  // Bright (not ghosted) for the chosen trail itself PLUS the row it's currently offering —
  // whichever real children hang directly off the deepest active node, i.e. the choices a tap
  // would pick between right now (see BookMindMap.tsx's own CAFD doc comment).
  isOnFocusedBranch: (id: string) => boolean;
  // Every node on the chosen trail (activePath) renders 1.5x an "inactive" one — genuinely every
  // OTHER node in the whole tree, not just the immediate siblings of whichever one was tapped
  // last: selecting Mark 12 shrinks Old Testament, History/Epistles/Prophecy, Luke/John/
  // Matthew, and everything else off that one trail, all alike.
  sizeScaleFor: (id: string) => number;
  // True for any node on the real chain down to TODAY's own actual lesson — see
  // lib/mindMapActivePath.ts's activeChainIds.
  isOnActiveChain: (id: string) => boolean;
}

// An active (on-trail) node renders exactly 1.5x an inactive one (1.2 / 0.8) — enough to read as
// "this is the chosen path" at a glance without ballooning so large it forces the tree's own
// spacing wide open. The root ("The Bible") is neither — it's always on screen regardless of
// selection, so it stays at its own plain 1x rather than ever shrinking or permanently
// ballooning. Exported for BookMindMap.tsx's own pericope cards too — a pericope never joins
// activePath (see onSelectPericope), so it needs the SAME shrink driven by its own `status`
// instead (not-today's-lesson vs. today's), reusing this one number rather than inventing a
// second "smaller" scale for the same visual language.
export const ACTIVE_SCALE = 1.2;
export const INACTIVE_SCALE = 0.8;

// The handful of small per-node lookups BookMindMap.tsx's own render loop needs, all pure
// derivations of (tree, activePath, parentMap) — pulled into their own hook purely to keep
// BookMindMap.tsx under this codebase's own 200-line file cap (see CLAUDE.md), no behavior
// difference from having them inline there.
export function useMindMapFocusState(tree: MindMapRootDatum, activePath: string[], parentMap: Map<string, string>): MindMapFocusState {
  const chainIds = useMemo(() => activeChainIds(tree), [tree]);
  return useMemo(() => {
    // "root" stands in for "nothing open yet" so the very top-level testament row reads as the
    // frontier in that state too, matching every other depth.
    const deepestId = activePath.length > 0 ? activePath[activePath.length - 1] : "root";
    return {
      isOnFocusedBranch: (id) => activePath.includes(id) || parentMap.get(id) === deepestId,
      sizeScaleFor: (id) => (id === "root" ? 1 : activePath.includes(id) ? ACTIVE_SCALE : INACTIVE_SCALE),
      isOnActiveChain: (id) => chainIds.has(id),
    };
  }, [activePath, parentMap, chainIds]);
}
