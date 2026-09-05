"use client";

import type { PathZone } from "@/lib/pathZones";
import type { PericopeCardState } from "@/lib/pericopeCardState";
import { dayLabel } from "@/components/gamification/DayCircle";
import { PERICOPE_NODE_RADIUS } from "@/lib/mindMapLayout";

interface MindMapPericopeNodeProps {
  zone: PathZone;
  state: PericopeCardState;
  x: number;
  y: number;
  onSelect: () => void;
}

const FILL_BY_STATUS = {
  active: "fill-brand-500",
  completed: "fill-brand-100 dark:fill-brand-900/40",
  locked: "fill-mist dark:fill-zinc-800",
} as const;

const STROKE_BY_STATUS = {
  active: "stroke-brand-600",
  completed: "stroke-brand-400 dark:stroke-brand-700",
  locked: "stroke-line dark:stroke-zinc-700",
} as const;

const TEXT_BY_STATUS = {
  active: "fill-white",
  completed: "fill-brand-700 dark:fill-brand-300",
  locked: "fill-ink-muted dark:fill-zinc-500",
} as const;

// A short label for this node — the zone's own verse range ("9-11") for a real pericope, or
// whatever short name DayCircle already uses for a capstone day (a weekly/monthly review, a
// section boss battle) for the rare zone that isn't one — same fallback PericopeCard.tsx's
// own actionLabel reaches for.
function shortLabel(zone: PathZone, state: PericopeCardState): string {
  if (zone.startVerse !== undefined && zone.endVerse !== undefined) {
    return zone.startVerse === zone.endVerse ? `${zone.startVerse}` : `${zone.startVerse}-${zone.endVerse}`;
  }
  return state.actionDay ? dayLabel(state.actionDay) : zone.label;
}

// One pericope's own node on a zoomed-in chapter's ring — same status-coloring language as
// MindMapChapterNode.tsx (locked/active/completed), just smaller and labeled with its verse
// range instead of a chapter number. Clicking it is real navigation (see MindMapCanvas.tsx's
// onSelect), the same select-vs-practice action lib/pericopeCardState.ts's computeZoneCardState
// already decided for this exact zone — so a click here does exactly what tapping this same
// pericope's card would do on the real path screen.
export function MindMapPericopeNode({ zone, state, x, y, onSelect }: MindMapPericopeNodeProps) {
  const label = shortLabel(zone, state);
  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={zone.label || label}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") onSelect();
      }}
      className="cursor-pointer outline-none"
    >
      {state.status === "active" && (
        <circle
          cx={x}
          cy={y}
          r={PERICOPE_NODE_RADIUS + 7}
          className="animate-pulse fill-none stroke-brand-500 stroke-2 opacity-70"
        />
      )}
      <circle
        cx={x}
        cy={y}
        r={PERICOPE_NODE_RADIUS}
        className={`${FILL_BY_STATUS[state.status]} ${STROKE_BY_STATUS[state.status]} stroke-2`}
      />
      <text
        x={x}
        y={y}
        textAnchor="middle"
        dominantBaseline="central"
        className={`${TEXT_BY_STATUS[state.status]} select-none text-[11px] font-semibold`}
      >
        {label}
      </text>
      {state.status === "completed" && (
        <g transform={`translate(${x + PERICOPE_NODE_RADIUS - 6}, ${y - PERICOPE_NODE_RADIUS + 6})`}>
          <circle r={8} className="fill-brand-500" />
          <path d="M -3 0 L -1 2.5 L 4 -3" className="fill-none stroke-white" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
        </g>
      )}
    </g>
  );
}
