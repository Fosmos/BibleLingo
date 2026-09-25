"use client";

import { useMemo } from "react";
import type { MindMapLayout } from "@/lib/mindMapTreeLayout";
import type { GenreId } from "@/lib/canonTree";
import { GENRE_BASE_HEX } from "@/lib/mindMapPlaceColor";

interface MindMapTerritoriesProps {
  layout: MindMapLayout;
  // child id -> parent id (see lib/mindMapActivePath.ts's buildParentMap).
  parentMap: Map<string, string>;
}

// Room left around a territory's outermost node (a ring's radius plus a margin) — tighter on top,
// so the wash starts just below its genre's own circle rather than spreading over the circles
// beside it in the same row.
const PADDING_PX = 56;
const TOP_PADDING_PX = 44;

interface Territory {
  genre: GenreId;
  x: number;
  y: number;
  width: number;
  height: number;
}

// The genre node a node lives under, if any — walked up the tree.
function genreAncestor(id: string, parentMap: Map<string, string>): string | undefined {
  let current: string | undefined = id;
  while (current) {
    if (current.startsWith("genre:")) return current;
    current = parentMap.get(current);
  }
  return undefined;
}

// Each genre drawn as a territory on the Mind Map — a soft wash of its colour (see
// lib/mindMapPlaceColor.ts) behind everything of it that's on screen, like a country on a map:
// the first thing spatial memory latches onto from far out ("Romans sat in the orange land, top
// right"). It spans every book, chapter, hall and verse of the OPEN genre that's laid out, so it
// follows what's open; the places inside it never move (see lib/mindMapTreeLayout.ts).
export function MindMapTerritories({ layout, parentMap }: MindMapTerritoriesProps) {
  const territories = useMemo(() => {
    const boxes = new Map<string, { minX: number; minY: number; maxX: number; maxY: number }>();
    const grow = (genreId: string, x: number, y: number) => {
      const box = boxes.get(genreId) ?? { minX: x, minY: y, maxX: x, maxY: y };
      boxes.set(genreId, { minX: Math.min(box.minX, x), minY: Math.min(box.minY, y), maxX: Math.max(box.maxX, x), maxY: Math.max(box.maxY, y) });
    };
    // Only what's laid out UNDER a genre, not the genre's own circle — so a closed genre (just its
    // circle) has no territory at all, and since only one branch is ever open (see
    // lib/mindMapActivePath.ts), territories never overlap.
    for (const node of layout.nodes) {
      if (node.data.kind === "genre") continue;
      const genreId = genreAncestor(node.data.id, parentMap);
      if (genreId) grow(genreId, node.cx, node.cy);
    }
    for (const chip of layout.verseChips) {
      const genreId = genreAncestor(chip.pericopeId, parentMap);
      if (genreId) grow(genreId, chip.x, chip.y);
    }
    return Array.from(boxes, ([genreId, box]): Territory => ({
      genre: genreId.split(":")[2] as GenreId,
      x: box.minX - PADDING_PX,
      y: box.minY - TOP_PADDING_PX,
      width: box.maxX - box.minX + PADDING_PX * 2,
      height: box.maxY - box.minY + TOP_PADDING_PX + PADDING_PX,
    }));
  }, [layout, parentMap]);

  return (
    <svg width={layout.width} height={layout.height} className="pointer-events-none absolute inset-0" aria-hidden="true">
      {territories.map((territory) => (
        <rect
          key={territory.genre}
          x={territory.x}
          y={territory.y}
          width={territory.width}
          height={territory.height}
          rx={56}
          fill={GENRE_BASE_HEX[territory.genre]}
          className="opacity-20 transition-all duration-300 dark:opacity-15"
        />
      ))}
    </svg>
  );
}
