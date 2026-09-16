"use client";

import { useMemo } from "react";
import type { MindMapLayout } from "@/lib/mindMapTreeLayout";

// The active book's own direct CHAPTER children fade left to right — see
// lib/mindMapGenreColor.ts's own gradientColor, which this hook's own 0..1 `t` values feed.
// Theme nodes are excluded even when they're the book's own direct children (a book with themes
// defined) — theme pills read with the SAME plain active/inactive genre color every other ring
// uses, not the fade, so a book's own theme row and chapter row never look like two different
// color systems. Built once per layout rather than inline per-node so every sibling agrees on
// the SAME row/count instead of each one re-deriving it. Pulled out of BookMindMap.tsx purely to
// keep that file under this codebase's own 200-line file cap (see CLAUDE.md) — no behavior
// difference from having it inline there.
export function useMindMapGradientRow(layout: MindMapLayout, parentMap: Map<string, string>, bookLabel: string): Map<string, number> {
  return useMemo(() => {
    const activeBookId = `book:${bookLabel}`;
    const row = layout.nodes
      .filter((node) => parentMap.get(node.data.id) === activeBookId && node.data.kind !== "theme")
      .sort((a, b) => a.cx - b.cx);
    const map = new Map<string, number>();
    row.forEach((node, index) => map.set(node.data.id, row.length > 1 ? index / (row.length - 1) : 0));
    return map;
  }, [layout, parentMap, bookLabel]);
}
