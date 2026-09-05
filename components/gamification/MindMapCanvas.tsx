"use client";

import { useRef, useState } from "react";
import type { ChapterNode } from "@/lib/useMindMapData";
import { useMindMapCamera } from "@/lib/useMindMapCamera";
import { VIEWPORT_WIDTH, VIEWPORT_HEIGHT } from "@/lib/mindMapLayout";
import { bookMapLayout, pericopeBranchLayout, elbowCurvePath } from "@/lib/mindMapShape";
import { MindMapChapterNode } from "@/components/gamification/MindMapChapterNode";
import { MindMapPericopeNode } from "@/components/gamification/MindMapPericopeNode";
import { MindMapBookNode } from "@/components/gamification/MindMapBookNode";
import { MindMapPaperBackground } from "@/components/gamification/MindMapPaperBackground";
import { MindMapPathView } from "@/components/gamification/MindMapPathView";

interface MindMapCanvasProps {
  bookLabel: string;
  chapters: ChapterNode[];
  completedDays: number;
  onSelectDay: (dayNumber: number) => void;
  onPracticeDay: (dayNumber: number) => void;
}

// Every branch — book-to-chapter and chapter-to-pericope alike — shares one bold, consistent
// color rather than a per-branch palette; the shape of the curve itself (elbowCurvePath) is
// what carries the "mind map" feel here, not color-coding.
const BRANCH_CLASS = "stroke-brand-500 dark:stroke-brand-400";
const BRANCH_WIDTH = 5;

// Free-pan/zoom SVG canvas shaped like a classic mind map: the book circle at the center
// (MindMapBookNode.tsx), chapters stacked in columns to its left and right
// (lib/mindMapShape.ts's bookMapLayout — a rare top/bottom outlier once there are enough
// chapters to crowd a column), each connected back to the book by a thick, bold curve
// (elbowCurvePath) that leaves already angled toward the chapter's own row and straightens
// out horizontally for its final approach. A chapter's own +/− icon expands or collapses its
// pericope branch IN PLACE, without moving the camera at all; clicking the chapter pill's
// own body instead pans/zooms the camera onto it (auto-expanding it too). Clicking one of
// those pericope pills is real navigation of a kind — it swaps the whole canvas for that
// chapter's own real path view (the exact PathDayList/PericopeCard list the actual path
// screen renders), where the real Learn/practice button lives.
export function MindMapCanvas({ bookLabel, chapters, completedDays, onSelectDay, onPracticeDay }: MindMapCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const { camera, isDragging, focusOn, resetToOverview, handlePointerDown, handlePointerMove, handlePointerUp } = useMindMapCamera(svgRef);
  const [focusedChapter, setFocusedChapter] = useState<number | null>(null);
  const [expandedChapters, setExpandedChapters] = useState<Set<number>>(new Set());
  const [pathViewChapter, setPathViewChapter] = useState<number | null>(null);

  const chapterPositions = bookMapLayout(chapters.length);
  const pathViewNode = chapters.find((chapter) => chapter.chapter === pathViewChapter);

  function handleChapterSelect(chapter: number, position: { x: number; y: number }) {
    setFocusedChapter(chapter);
    setExpandedChapters((prev) => new Set(prev).add(chapter));
    focusOn(position);
  }

  function toggleExpanded(chapter: number) {
    setExpandedChapters((prev) => {
      const next = new Set(prev);
      if (next.has(chapter)) next.delete(chapter);
      else next.add(chapter);
      return next;
    });
  }

  function handleZoomOut() {
    setFocusedChapter(null);
    resetToOverview();
  }

  if (pathViewNode) {
    return (
      <MindMapPathView
        chapter={pathViewNode}
        completedDays={completedDays}
        onSelectDay={onSelectDay}
        onPracticeDay={onPracticeDay}
        onBack={() => setPathViewChapter(null)}
      />
    );
  }

  return (
    <div className="relative h-full w-full touch-none select-none">
      {focusedChapter !== null && (
        <button
          type="button"
          onClick={handleZoomOut}
          className="absolute left-3 top-3 z-10 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-ink shadow-sm dark:bg-zinc-900 dark:text-zinc-100"
        >
          ← Zoom out
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
        <g transform={`translate(${camera.x} ${camera.y}) scale(${camera.scale})`} className={isDragging ? "" : "transition-transform duration-300 ease-out"}>
          <MindMapPaperBackground />

          {chapters.map((chapter, index) => (
            <path
              key={`book-line-${chapter.chapter}`}
              d={elbowCurvePath({ x: 0, y: 0 }, chapterPositions[index])}
              fill="none"
              strokeWidth={BRANCH_WIDTH}
              strokeLinecap="round"
              className={BRANCH_CLASS}
            />
          ))}

          {chapters.map((chapter, index) => {
            if (!expandedChapters.has(chapter.chapter)) return null;
            const position = chapterPositions[index];
            const branchPositions = pericopeBranchLayout(position, position.side, chapter.zones.length);
            return (
              <g key={`branch-${chapter.chapter}`}>
                {chapter.zones.map((zone, zoneIndex) => (
                  <path
                    key={`branch-line-${zone.zoneNumber}`}
                    d={elbowCurvePath(position, branchPositions[zoneIndex])}
                    fill="none"
                    strokeWidth={BRANCH_WIDTH - 1}
                    strokeLinecap="round"
                    className={BRANCH_CLASS}
                  />
                ))}
                {chapter.zones.map((zone, zoneIndex) => (
                  <MindMapPericopeNode
                    key={`${zone.zoneNumber}-${zone.label}`}
                    zone={zone}
                    state={chapter.states[zoneIndex]}
                    x={branchPositions[zoneIndex].x}
                    y={branchPositions[zoneIndex].y}
                    onSelect={() => setPathViewChapter(chapter.chapter)}
                  />
                ))}
              </g>
            );
          })}

          {chapters.map((chapter, index) => (
            <MindMapChapterNode
              key={chapter.chapter}
              chapter={chapter.chapter}
              x={chapterPositions[index].x}
              y={chapterPositions[index].y}
              side={chapterPositions[index].side}
              status={chapter.status}
              expanded={expandedChapters.has(chapter.chapter)}
              onSelect={() => handleChapterSelect(chapter.chapter, chapterPositions[index])}
              onToggleExpand={() => toggleExpanded(chapter.chapter)}
            />
          ))}

          <MindMapBookNode bookLabel={bookLabel} />
        </g>
      </svg>
    </div>
  );
}
