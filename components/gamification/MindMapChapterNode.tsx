"use client";

import type { PericopeCardStatus } from "@/lib/pericopeCardState";
import { CHAPTER_PILL_WIDTH, CHAPTER_PILL_HEIGHT } from "@/lib/mindMapLayout";
import type { ChapterSide } from "@/lib/mindMapShape";

interface MindMapChapterNodeProps {
  chapter: number;
  x: number;
  y: number;
  side: ChapterSide;
  status: PericopeCardStatus;
  expanded: boolean;
  // Clicking the pill's own body — pans/zooms the camera in on this chapter (and implies
  // expanding it too, see MindMapCanvas.tsx).
  onSelect: () => void;
  // Clicking just the small +/− icon — toggles this chapter's pericope branch in place,
  // without touching the camera at all.
  onToggleExpand: () => void;
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

const ICON_GAP = 14;
const ICON_RADIUS = 11;

// Where the expand icon sits relative to the pill's own center — always on the pill's
// OUTWARD-facing edge (the same direction its pericope branch will extend in once expanded,
// see lib/mindMapLayout.ts's pericopeBranchLayout), so the icon itself hints at which way
// the branch is about to grow.
function iconOffset(side: ChapterSide): { x: number; y: number } {
  if (side === "right") return { x: CHAPTER_PILL_WIDTH / 2 + ICON_GAP, y: 0 };
  if (side === "left") return { x: -CHAPTER_PILL_WIDTH / 2 - ICON_GAP, y: 0 };
  if (side === "top") return { x: 0, y: -CHAPTER_PILL_HEIGHT / 2 - ICON_GAP };
  return { x: 0, y: CHAPTER_PILL_HEIGHT / 2 + ICON_GAP };
}

// One chapter's own node on the Mind Map's main branches — a pill (same shape language as
// the book pill it grows from) with a soft drop shadow, colored by its aggregate status (see
// lib/useMindMapData.ts's chapterStatus): brand-solid for the currently active chapter (plus
// a pulsing outline so "you are here" reads at a glance), a tinted/checked pill once every
// lesson in it is done, and a muted pill for anything not reached yet. Two separate click
// targets: the pill body itself (onSelect — zooms the camera in) and a small +/− icon on its
// outward edge (onToggleExpand — reveals/hides its pericope branch in place, independent of
// the camera).
export function MindMapChapterNode({ chapter, x, y, side, status, expanded, onSelect, onToggleExpand }: MindMapChapterNodeProps) {
  const left = x - CHAPTER_PILL_WIDTH / 2;
  const top = y - CHAPTER_PILL_HEIGHT / 2;
  const rx = CHAPTER_PILL_HEIGHT / 2;
  const icon = iconOffset(side);

  return (
    <g>
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
          <rect
            x={left - 6}
            y={top - 6}
            width={CHAPTER_PILL_WIDTH + 12}
            height={CHAPTER_PILL_HEIGHT + 12}
            rx={rx + 6}
            className="animate-pulse fill-none stroke-brand-500 stroke-2 opacity-70"
          />
        )}
        <rect
          x={left}
          y={top}
          width={CHAPTER_PILL_WIDTH}
          height={CHAPTER_PILL_HEIGHT}
          rx={rx}
          filter="url(#mm-pill-shadow)"
          className={`${FILL_BY_STATUS[status]} ${STROKE_BY_STATUS[status]} stroke-2`}
        />
        <text x={x} y={y} textAnchor="middle" dominantBaseline="central" className={`${TEXT_BY_STATUS[status]} select-none text-sm font-semibold`}>
          Ch. {chapter}
        </text>
        {status === "completed" && (
          <g transform={`translate(${left + CHAPTER_PILL_WIDTH - 8}, ${top + 8})`}>
            <circle r={9} className="fill-brand-500" />
            <path d="M -4 0 L -1 3.5 L 5 -4" className="fill-none stroke-white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </g>
        )}
      </g>

      <g
        role="button"
        tabIndex={0}
        aria-label={expanded ? `Collapse chapter ${chapter}'s sections` : `Expand chapter ${chapter}'s sections`}
        onClick={(event) => {
          event.stopPropagation();
          onToggleExpand();
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.stopPropagation();
            onToggleExpand();
          }
        }}
        transform={`translate(${x + icon.x}, ${y + icon.y})`}
        className="cursor-pointer outline-none"
      >
        <circle r={ICON_RADIUS} className="fill-white stroke-brand-500 stroke-2 dark:fill-zinc-900" />
        <path d="M -5 0 H 5" className="stroke-brand-500" strokeWidth={2} strokeLinecap="round" />
        {!expanded && <path d="M 0 -5 V 5" className="stroke-brand-500" strokeWidth={2} strokeLinecap="round" />}
      </g>
    </g>
  );
}
