"use client";

import type { NodeCentre } from "@/lib/useNodeCentres";

interface ChapterPathRoadProps {
  centres: NodeCentre[];
  // Per node (same order): its verse number, its pericope's base colour, and whether the stretch of
  // road into it is walked (solid — both ends started) or still ahead (dotted).
  nodes: { verseNumber: number; colour: string; walked: boolean }[];
}

// The winding road down the Chapter Path View's gutter: one S-curve between each pair of verse
// nodes, coloured by the destination verse's pericope. Drawn under the nodes and text.
export function ChapterPathRoad({ centres, nodes }: ChapterPathRoadProps) {
  return (
    <svg className="pointer-events-none absolute inset-0 z-[1] h-full w-full overflow-visible" aria-hidden="true">
      {centres.slice(1).map((to, index) => {
        const from = centres[index];
        const node = nodes[index + 1];
        if (!node) return null;
        const midY = (from[1] + to[1]) / 2;
        return (
          <path
            key={node.verseNumber}
            d={`M${from[0]} ${from[1]}C${from[0]} ${midY} ${to[0]} ${midY} ${to[0]} ${to[1]}`}
            stroke={node.colour}
            strokeWidth={8}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={node.walked ? undefined : "1 13"}
          />
        );
      })}
    </svg>
  );
}
