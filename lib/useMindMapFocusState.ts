"use client";

import { useMemo } from "react";

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
}

// An active (on-trail) node renders exactly 1.5x an inactive one (1.2 / 0.8) — enough to read as
// "this is the chosen path" at a glance without ballooning so large it forces the tree's own
// spacing wide open. The root ("The Bible") is neither — it's always on screen regardless of
// selection, so it stays at its own plain 1x rather than ever shrinking or permanently
// ballooning. Exported for BookMindMap.tsx's own pericope cards too — a pericope never joins
// activePath (see onSelectPericope), so it needs the SAME shrink driven by its own `status`
// instead (not-today's-lesson vs. today's), reusing this one number rather than inventing a
// second "smaller" scale for the same visual language.
//
// Both are now 1: a node's size never changes with focus. The map is read as a memory palace, and
// a place that grows, shrinks or shifts as you move around can't be remembered by where it is and
// what it looks like — focus shows through dimming alone.
export const ACTIVE_SCALE = 1;
export const INACTIVE_SCALE = 1;

// The handful of small per-node lookups BookMindMap.tsx's own render loop needs, all pure
// derivations of (activePath, parentMap) — pulled into their own hook purely to keep
// BookMindMap.tsx under this codebase's own 200-line file cap (see CLAUDE.md), no behavior
// difference from having them inline there.
export function useMindMapFocusState(activePath: string[], parentMap: Map<string, string>): MindMapFocusState {
  return useMemo(() => {
    // "root" stands in for "nothing open yet" so the very top-level testament row reads as the
    // frontier in that state too, matching every other depth.
    const deepestId = activePath.length > 0 ? activePath[activePath.length - 1] : "root";
    return {
      isOnFocusedBranch: (id) => activePath.includes(id) || parentMap.get(id) === deepestId,
      sizeScaleFor: (id) => (id === "root" ? 1 : activePath.includes(id) ? ACTIVE_SCALE : INACTIVE_SCALE),
    };
  }, [activePath, parentMap]);
}
