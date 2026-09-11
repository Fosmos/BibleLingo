"use client";

import type { PericopeCardStatus } from "@/lib/pericopeCardState";
import { CHAPTER_NODE_RADIUS } from "@/lib/mindMapLayout";

interface MindMapChapterNodeProps {
  chapter: number;
  x: number;
  y: number;
  status: PericopeCardStatus;
  onSelect: () => void;
}

const FILL_BY_STATUS: Record<PericopeCardStatus, string> = {
  active: "fill-brand-500",
  completed: "fill-brand-100 dark:fill-brand-900/40",
  locked: "fill-mist dark:fill-zinc-800",
};

const STROKE_BY_STATUS: Record<PericopeCardStatus, string> = {
  active: "stroke-brand-600",
  completed: "stroke-brand-400 dark:stroke-brand-700",
  locked: "stroke-line dark:stroke-zinc-700",
};

const TEXT_BY_STATUS: Record<PericopeCardStatus, string> = {
  active: "fill-white",
  completed: "fill-brand-700 dark:fill-brand-300",
  locked: "fill-ink-muted dark:fill-zinc-500",
};

// One chapter's own node on the Mind Map's main ring — a plain numbered circle, colored by
// its aggregate status (see lib/useMindMapData.ts's chapterStatus): brand-solid for the
// currently active chapter (plus a pulsing outer ring so "you are here" reads at a glance
// even before zooming in), a tinted/checked circle once every lesson in it is done, and a
// muted circle for anything not reached yet. Clicking it is the only way in — the canvas
// itself (MindMapCanvas.tsx) owns what "click" actually does (animate the camera in and
// reveal this chapter's own pericope ring).
export function MindMapChapterNode({ chapter, x, y, status, onSelect }: MindMapChapterNodeProps) {
  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={`Chapter ${chapter}`}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") onSelect();
      }}
      className="cursor-pointer outline-none"
    >
      {status === "active" && (
        <circle
          cx={x}
          cy={y}
          r={CHAPTER_NODE_RADIUS + 9}
          className="animate-pulse fill-none stroke-brand-500 stroke-2 opacity-70"
        />
      )}
      <circle cx={x} cy={y} r={CHAPTER_NODE_RADIUS} className={`${FILL_BY_STATUS[status]} ${STROKE_BY_STATUS[status]} stroke-2`} />
      <text
        x={x}
        y={y}
        textAnchor="middle"
        dominantBaseline="central"
        className={`${TEXT_BY_STATUS[status]} select-none text-base font-semibold`}
      >
        {chapter}
      </text>
      {status === "completed" && (
        <g transform={`translate(${x + CHAPTER_NODE_RADIUS - 8}, ${y - CHAPTER_NODE_RADIUS + 8})`}>
          <circle r={10} className="fill-brand-500" />
          <path d="M -4 0 L -1 3.5 L 5 -4" className="fill-none stroke-white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </g>
      )}
    </g>
  );
}
