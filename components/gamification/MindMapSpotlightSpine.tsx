import type { MindMapSpine } from "@/lib/mindMapLayoutTypes";
import { splitSpineIntoSegments } from "@/lib/mindMapSpineSegments";
import { SPINE_SOLID_BROWN_CLASS, LINK_STROKE_CLASS } from "@/lib/mindMapGenreColor";

interface MindMapSpotlightSpineProps {
  spine: MindMapSpine | undefined;
  width: number;
  height: number;
}

// LearnMindMapSpotlight.tsx's own connector curve — the SAME `splitSpineIntoSegments` +
// dashed/solid completed-segment convention `MindMapLinks.tsx` draws on the real canvas, minus
// that file's own CAFD dimming/`<mask>` machinery: nothing in this read-only, single-chapter
// spotlight is ever dimmed, so there's no hole to cut.
export function MindMapSpotlightSpine({ spine, width, height }: MindMapSpotlightSpineProps) {
  if (!spine) return null;
  const segments = splitSpineIntoSegments(spine.points);
  return (
    <svg width={width} height={height} className="absolute inset-0 overflow-visible">
      {segments.map((d, index) => {
        const point = spine.points[index];
        const stroke = spine.points[index + 1]?.stroke;
        return (
          <path
            key={index}
            d={d}
            fill="none"
            stroke={stroke}
            strokeWidth={point.completed ? 3 : 2.5}
            strokeLinecap="round"
            strokeDasharray={point.completed ? undefined : "1 8"}
            className={stroke ? undefined : point.completed ? SPINE_SOLID_BROWN_CLASS : LINK_STROKE_CLASS}
          />
        );
      })}
    </svg>
  );
}
