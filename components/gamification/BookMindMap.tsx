"use client";

import { useMemo, useState } from "react";
import { linkRadial } from "d3-shape";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import type { ChapterNode } from "@/lib/useMindMapData";
import { buildMindMapTree } from "@/lib/mindMapHierarchy";
import { computeMindMapLayout, type PolarPoint } from "@/lib/mindMapTreeLayout";
import { MindMapNodeCard } from "@/components/gamification/MindMapNodeCard";

interface BookMindMapProps {
  bookLabel: string;
  chapters: ChapterNode[];
  completedDays: number;
  todaysDay: number;
  // Tapping a pericope card opens that chapter's own parchment view, straight to the real
  // page that pericope's own first verse (startVerse) falls on — never a direct route to a
  // lesson/practice URL; the parchment view is where an individual verse run's own tap does
  // that (see PericopeCard.tsx/ChapterReadingView.tsx).
  onSelectChapter: (chapter: number, startVerse?: number) => void;
}

// lib/mindMapTreeLayout.ts already hands back each link's own (angle, radius) pair for both
// ends, correctly placed by hand (a book-to-chapter link's start point already sits on the
// book's own edge, angled toward that specific chapter — see that file's own comment) — so
// this generator just needs plain accessors, no per-link special-casing here.
const linkGenerator = linkRadial<{ source: PolarPoint; target: PolarPoint }, PolarPoint>()
  .angle((point) => point.angle)
  .radius((point) => point.radius);

const ZOOM_BUTTON_CLASS = "flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm font-bold text-ink shadow-sm dark:bg-zinc-900 dark:text-zinc-100";
// Roughly how wide a comfortable first look at the whole tree should be on screen, regardless
// of how large the underlying canvas ends up (a bigger book's radial layout grows outward but
// stays roughly square — see computeMindMapLayout) — scaled down further, never up, so a
// small tree doesn't start zoomed in past a normal viewport.
const TARGET_INITIAL_DIAMETER_PX = 640;

// A free pan/zoom canvas of the currently active book path's own Book -> Chapter -> Pericope
// tree, laid out RADIALLY (see lib/mindMapTreeLayout.ts) rather than as a linear left-to-right
// tree — a linear layout's sibling axis stretches linearly with leaf count, which is what
// crushed the whole canvas into an unreadable flat line for any book with more than a
// handful of pericopes; a radial one keeps the canvas roughly square no matter how many. Only
// one chapter's own pericopes render at a time by default (tap a chapter to expand/collapse
// it — see expandedChapters below) — even a collision-free, perfectly-spaced tree of 90+
// pericopes is still a lot of simultaneous visual density, and most of that detail is only
// ever relevant for whichever chapter the reader is actually looking at right now. d3-shape's
// linkRadial draws the connector curves behind each node; react-zoom-pan-pinch supplies real
// pinch/pan/zoom gesture handling. Nodes render as plain absolutely-positioned HTML cards, not
// foreignObject — better text wrapping and hit-testing across browsers for what's ultimately
// just styled text in a circle.
function activeChapterIds(chapters: ChapterNode[]): Set<string> {
  return new Set(chapters.filter((chapter) => chapter.status === "active").map((chapter) => `ch-${chapter.chapter}`));
}

export function BookMindMap({ bookLabel, chapters, completedDays, todaysDay, onSelectChapter }: BookMindMapProps) {
  // Starts with just the chapter that's actually active today expanded — not every chapter,
  // and not none of them — same "don't make the reader hunt for today" instinct
  // ChapterReadingView.tsx's own auto-jump-to-today logic follows. Reset (not merely seeded)
  // whenever the book itself changes, per this codebase's own "adjusting state when a prop
  // changes" convention (see PathOverviewScreen.tsx's chapterOverride) — a switch to a
  // different book shouldn't carry over whichever chapters happened to be open before.
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(() => activeChapterIds(chapters));
  const [expandedResetKey, setExpandedResetKey] = useState(bookLabel);
  if (bookLabel !== expandedResetKey) {
    setExpandedResetKey(bookLabel);
    setExpandedChapters(activeChapterIds(chapters));
  }

  const layout = useMemo(
    () => computeMindMapLayout(buildMindMapTree(bookLabel, chapters, completedDays, todaysDay), expandedChapters),
    [bookLabel, chapters, completedDays, todaysDay, expandedChapters],
  );
  const initialScale = Math.min(1, TARGET_INITIAL_DIAMETER_PX / layout.width);

  function toggleChapter(chapterId: string) {
    setExpandedChapters((prev) => {
      const next = new Set(prev);
      if (next.has(chapterId)) next.delete(chapterId);
      else next.add(chapterId);
      return next;
    });
  }

  return (
    <TransformWrapper minScale={0.05} maxScale={3} initialScale={initialScale} centerOnInit doubleClick={{ mode: "toggle" }}>
      {({ zoomIn, zoomOut, resetTransform }) => (
        <div className="relative h-full w-full">
          <div className="absolute right-3 top-3 z-20 flex items-center gap-1.5">
            <button type="button" onClick={() => zoomIn()} aria-label="Zoom in" className={ZOOM_BUTTON_CLASS}>
              +
            </button>
            <button type="button" onClick={() => zoomOut()} aria-label="Zoom out" className={ZOOM_BUTTON_CLASS}>
              −
            </button>
            <button
              type="button"
              onClick={() => resetTransform()}
              className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-ink shadow-sm dark:bg-zinc-900 dark:text-zinc-100"
            >
              Reset
            </button>
          </div>
          <TransformComponent wrapperClass="!h-full !w-full !bg-mist dark:!bg-zinc-950" contentClass="!items-start">
            <div className="relative" style={{ width: layout.width, height: layout.height }}>
              <svg width={layout.width} height={layout.height} className="absolute inset-0">
                <g transform={`translate(${layout.centerX}, ${layout.centerY})`}>
                  {layout.links.map((link, index) => (
                    <path
                      key={index}
                      d={linkGenerator({ source: link.source, target: link.target }) ?? undefined}
                      fill="none"
                      strokeWidth={2}
                      className="stroke-brand-300 dark:stroke-brand-700"
                    />
                  ))}
                </g>
              </svg>
              {layout.nodes.map((node) => (
                <MindMapNodeCard
                  key={node.data.id}
                  datum={node.data}
                  x={node.cx}
                  y={node.cy}
                  expanded={node.data.kind === "chapter" && expandedChapters.has(node.data.id)}
                  onSelectPericope={onSelectChapter}
                  onToggleChapter={toggleChapter}
                />
              ))}
            </div>
          </TransformComponent>
        </div>
      )}
    </TransformWrapper>
  );
}
