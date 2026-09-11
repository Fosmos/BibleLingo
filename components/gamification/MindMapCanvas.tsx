"use client";

import { useRef, useState } from "react";
import type { ChapterNode } from "@/lib/useMindMapData";
import type { PericopeCardState } from "@/lib/pericopeCardState";
import { useMindMapCamera } from "@/lib/useMindMapCamera";
import {
  ringLayout,
  VIEWPORT_WIDTH,
  VIEWPORT_HEIGHT,
  BOOK_PILL_WIDTH,
  BOOK_PILL_HEIGHT,
  CHAPTER_RING_RADIUS,
  PERICOPE_RING_RADIUS,
  type Point,
} from "@/lib/mindMapLayout";
import { MindMapChapterNode } from "@/components/gamification/MindMapChapterNode";
import { MindMapPericopeNode } from "@/components/gamification/MindMapPericopeNode";

interface MindMapCanvasProps {
  bookLabel: string;
  chapters: ChapterNode[];
  onSelectDay: (dayNumber: number) => void;
  onPracticeDay: (dayNumber: number) => void;
}

// Free-pan/zoom SVG canvas: the book pill sits at the world origin, every chapter is placed
// on a ring around it (lib/mindMapLayout.ts's ringLayout), connected by a line each — the
// "main view" this always starts on. Clicking a chapter reveals a second ring of its own
// pericope nodes around that chapter's own position and animates the camera to center/zoom
// on it (see lib/useMindMapCamera.ts's focusOn); the pericope nodes' own color/checkmark
// come straight from lib/useMindMapData.ts's computeZoneCardState call, so they always match
// the same pericope's card on the real path screen — and a click on one is that same
// select-vs-practice navigation, not a preview. Dragging pans, the wheel zooms toward the
// cursor; both are handled by useMindMapCamera, which owns the actual camera state.
export function MindMapCanvas({ bookLabel, chapters, onSelectDay, onPracticeDay }: MindMapCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const { camera, isDragging, focusOn, resetToOverview, handlePointerDown, handlePointerMove, handlePointerUp } =
    useMindMapCamera(svgRef);
  const [focusedChapter, setFocusedChapter] = useState<number | null>(null);

  const chapterPositions = ringLayout(chapters.length, CHAPTER_RING_RADIUS);
  const focusedIndex = chapters.findIndex((chapter) => chapter.chapter === focusedChapter);
  const focusedNode = focusedIndex !== -1 ? chapters[focusedIndex] : undefined;
  const focusedPosition = focusedIndex !== -1 ? chapterPositions[focusedIndex] : undefined;
  const pericopePositions =
    focusedNode && focusedPosition ? ringLayout(focusedNode.zones.length, PERICOPE_RING_RADIUS, focusedPosition) : [];

  function handleChapterSelect(chapter: number, position: Point) {
    setFocusedChapter(chapter);
    focusOn(position);
  }

  function handleBack() {
    setFocusedChapter(null);
    resetToOverview();
  }

  function handlePericopeSelect(state: PericopeCardState) {
    if (!state.actionDay) return;
    if (state.actionKind === "practice") onPracticeDay(state.actionDay.dayNumber);
    else onSelectDay(state.actionDay.dayNumber);
  }

  return (
    <div className="relative h-full w-full touch-none select-none">
      {focusedChapter !== null && (
        <button
          type="button"
          onClick={handleBack}
          className="absolute left-3 top-3 z-10 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-ink shadow-sm dark:bg-zinc-900 dark:text-zinc-100"
        >
          ← Back to book
        </button>
      )}
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEWPORT_WIDTH} ${VIEWPORT_HEIGHT}`}
        className={`h-full w-full bg-mist dark:bg-zinc-950 ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <g
          transform={`translate(${camera.x} ${camera.y}) scale(${camera.scale})`}
          className={isDragging ? "" : "transition-transform duration-300 ease-out"}
        >
          {chapters.map((chapter, index) => (
            <line
              key={`book-line-${chapter.chapter}`}
              x1={0}
              y1={0}
              x2={chapterPositions[index].x}
              y2={chapterPositions[index].y}
              strokeWidth={2}
              className="stroke-line dark:stroke-zinc-700"
            />
          ))}

          {focusedNode?.zones.map((zone, index) => (
            <line
              key={`chapter-line-${zone.zoneNumber}`}
              x1={focusedPosition!.x}
              y1={focusedPosition!.y}
              x2={pericopePositions[index].x}
              y2={pericopePositions[index].y}
              strokeWidth={2}
              className="stroke-brand-400 dark:stroke-brand-700"
            />
          ))}

          {chapters.map((chapter, index) => (
            <MindMapChapterNode
              key={chapter.chapter}
              chapter={chapter.chapter}
              x={chapterPositions[index].x}
              y={chapterPositions[index].y}
              status={chapter.status}
              onSelect={() => handleChapterSelect(chapter.chapter, chapterPositions[index])}
            />
          ))}

          {focusedNode?.zones.map((zone, index) => (
            <MindMapPericopeNode
              key={`${zone.zoneNumber}-${zone.label}`}
              zone={zone}
              state={focusedNode.states[index]}
              x={pericopePositions[index].x}
              y={pericopePositions[index].y}
              onSelect={() => handlePericopeSelect(focusedNode.states[index])}
            />
          ))}

          <g transform={`translate(${-BOOK_PILL_WIDTH / 2}, ${-BOOK_PILL_HEIGHT / 2})`}>
            <rect
              width={BOOK_PILL_WIDTH}
              height={BOOK_PILL_HEIGHT}
              rx={BOOK_PILL_HEIGHT / 2}
              className="fill-brand-600 stroke-brand-700 stroke-2"
            />
            <text
              x={BOOK_PILL_WIDTH / 2}
              y={BOOK_PILL_HEIGHT / 2}
              textAnchor="middle"
              dominantBaseline="central"
              className="select-none fill-white font-serif text-base font-semibold"
            >
              {bookLabel}
            </text>
          </g>
        </g>
      </svg>
    </div>
  );
}
