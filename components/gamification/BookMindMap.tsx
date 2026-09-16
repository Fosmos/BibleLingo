"use client";

import { useMemo, useRef, useState } from "react";
import { TransformWrapper, TransformComponent, type ReactZoomPanPinchRef } from "react-zoom-pan-pinch";
import type { ChapterNode } from "@/lib/useMindMapData";
import { buildMindMapTree } from "@/lib/mindMapHierarchy";
import { computeMindMapLayout } from "@/lib/mindMapTreeLayout";
import { buildParentMap, defaultActivePath, toggleActivePath, findBrowsedBook, findBrowsedChapter } from "@/lib/mindMapActivePath";
import { useMindMapAutoCenter } from "@/lib/useMindMapAutoCenter";
import { useMindMapFocusState, INACTIVE_SCALE } from "@/lib/useMindMapFocusState";
import { useMindMapGradientRow } from "@/lib/useMindMapGradientRow";
import { useMindMapBrowseChapter } from "@/lib/useMindMapBrowseChapter";
import { useProgressStore } from "@/store/useProgressStore";
import { CANVAS_BG_CLASS } from "@/lib/mindMapGenreColor";
import { MindMapNodeCard } from "@/components/gamification/MindMapNodeCard";
import { MindMapZoomControls } from "@/components/gamification/MindMapZoomControls";
import { MindMapLinks } from "@/components/gamification/MindMapLinks";

interface BookMindMapProps {
  bookLabel: string;
  chapters: ChapterNode[];
  completedDays: number;
  todaysDay: number;
  // The active path's own translation — reused for any OTHER book's own on-demand browse fetch
  // too (see lib/useMindMapBrowseChapter.ts), one shared translation preference across the whole
  // canvas rather than a per-book one.
  version: string;
  // Tapping a pericope card opens that chapter's own parchment view, straight to the real
  // page that pericope's own first verse (startVerse) falls on — never a direct route to a
  // lesson/practice URL; the parchment view is where an individual verse run's own tap does
  // that (see PericopeCard.tsx/ChapterReadingView.tsx). Only ever wired up for the real ACTIVE
  // book's own pericopes — a browsed (non-active) book's own pericope tap instead offers to
  // switch there (see the floating "Start learning" button below).
  onSelectChapter: (chapter: number, startVerse?: number) => void;
  // Switches the active learning path to a different book — the floating "Start learning
  // {book}" button below, once a non-active book is being browsed (see onSwitchBook below).
  onSwitchBook: (bookName: string) => void;
}

// A free pan/zoom canvas of the WHOLE canon's own Bible -> Testament -> Genre -> Book ->
// Chapter -> Pericope tree, laid out top-down (see lib/mindMapTreeLayout.ts) rather than
// radially — a vertical dendrogram reads as the familiar "outline" shape readers already
// associate with a table of contents, whereas the tree's old radial layout only ever really
// suited a SINGLE book's own two-ring shape and had no natural way to keep growing outward
// through Genre/Testament/Bible without the whole canvas either overlapping itself or
// stretching illegibly wide. The currently ACTIVE book (the path this screen is showing) always
// has real chapters/pericopes loaded under it; tapping any OTHER book's own node now opens its
// own real chapter ring too, fetched on demand (see lib/useMindMapBrowseChapter.ts) — CAFD's own
// single-open-branch rule means at most one non-active book is ever browsed at once, so this
// never costs more than one extra chapter's worth of network requests at a time. Browsing a book
// doesn't switch the reader's actual active learning path — that's the floating "Start learning"
// button's own job, once a non-active book is open (see onSwitchBook below). On first paint the
// view is centered and zoomed on the active book's own local cluster (see
// useMindMapAutoCenter.ts) — not the whole Bible — matching how this screen always used to open
// centered on the book before the canon-wide levels existed; panning/zooming out from there
// reveals the rest of the tree, tap by tap. d3-shape's linkVertical draws the connector curves
// behind each node; react-zoom-pan-pinch supplies real pinch/pan/zoom gesture handling. Nodes
// render as plain absolutely-positioned HTML cards, not foreignObject — better text wrapping and
// hit-testing across browsers for what's ultimately just styled text in a circle.
//
// Contextual Accordion Focus-Dimming (CAFD): the canvas holds exactly ONE open branch at a time
// — `activePath` (see lib/mindMapActivePath.ts), a single ordered chain of ids from just under
// the root down to whatever was tapped last, replacing the old expandedIds Set that let a
// testament, a genre, several chapters, AND several themes all stay open simultaneously.
// Exclusivity is enforced at EVERY depth (not just the pericope/leaf ring): opening any node
// collapses whichever sibling used to be open at that same level, and everything below it, since
// the open branch can only ever be one unbroken path — see toggleActivePath's own doc comment.
// Every node/link that's neither ON that path NOR one of the deepest active node's own real
// children dims to 25% opacity (see MindMapNodeCard.tsx's own `dimmed` prop and this file's own
// link rendering below, both via isOnFocusedBranch) — "ghosted, faded background" abandoned
// siblings/branches the reader can still see and tap, just clearly not the current focus. The
// chosen trail AND the row it's currently offering to choose from (the "frontier," see
// isOnFocusedBranch) both stay fully bright — a freshly revealed row of choices reads as live
// options, not something already dismissed. The view also re-centers on that same frontier every
// time `activePath` changes, not just once on mount, so the reader is never left having to
// hunt-and-pan to see what a tap just revealed.
export function BookMindMap({ bookLabel, chapters, completedDays, todaysDay, version, onSelectChapter, onSwitchBook }: BookMindMapProps) {
  const paths = useProgressStore((state) => state.paths);
  // Starts with just the path down to today's own lesson open (see defaultActivePath) — reset
  // (not merely seeded) whenever the active book itself changes, per this codebase's own
  // "adjusting state when a prop changes" convention (see PathOverviewScreen.tsx's
  // chapterOverride) — switching books shouldn't carry over whichever branch happened to be
  // open in the last one.
  const [activePath, setActivePath] = useState<string[]>(() => defaultActivePath(bookLabel, chapters));
  const [expandedResetKey, setExpandedResetKey] = useState(bookLabel);
  if (bookLabel !== expandedResetKey) {
    setExpandedResetKey(bookLabel);
    setActivePath(defaultActivePath(bookLabel, chapters));
  }

  // Which OTHER book (and, within it, which chapter) is currently open for structural browsing
  // — see lib/useMindMapBrowseChapter.ts's own doc comment. `browseTick` bumps once that fetch
  // resolves, folded into the tree's own memo deps below so it recomputes reading the now-cached
  // data.
  const browsedBookName = findBrowsedBook(activePath, bookLabel);
  const browsedChapter = findBrowsedChapter(activePath, browsedBookName);
  const browseTick = useMindMapBrowseChapter(browsedBookName, browsedChapter ?? null, version);

  const tree = useMemo(
    () => buildMindMapTree(paths, bookLabel, chapters, completedDays, todaysDay, browsedBookName ?? undefined, browsedChapter),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- browseTick is a pure "re-read the cache" nudge, not a real input
    [paths, bookLabel, chapters, completedDays, todaysDay, browsedBookName, browsedChapter, browseTick],
  );
  const parentMap = useMemo(() => buildParentMap(tree), [tree]);
  const layout = useMemo(() => computeMindMapLayout(tree, new Set(activePath)), [tree, activePath]);
  const { isOnFocusedBranch, sizeScaleFor, isOnActiveChain } = useMindMapFocusState(tree, activePath, parentMap);
  const gradientTById = useMindMapGradientRow(layout, parentMap, bookLabel);

  function toggleNode(id: string) {
    setActivePath((prev) => toggleActivePath(tree, prev, id));
  }

  // A real active-book pericope opens its own chapter's parchment view, same as always; a
  // browsed (non-active) book's own pericope has no real lesson to open yet — tapping it instead
  // offers to switch the active path there, same action the floating "Start learning" button
  // below performs.
  function handleSelectPericope(chapter: number, startVerse: number | undefined, book: string) {
    if (book === bookLabel) onSelectChapter(chapter, startVerse);
    else onSwitchBook(book);
  }

  const wrapperRef = useRef<HTMLDivElement>(null);
  const transformRef = useRef<ReactZoomPanPinchRef | null>(null);
  // Re-centers/zooms on the open branch's own frontier every time it changes, focused on
  // whichever book (active, or currently browsed) is actually local to it — see
  // lib/useMindMapAutoCenter.ts's own doc comment (moved out of this component to stay under
  // this codebase's own 200-line file cap).
  useMindMapAutoCenter({ focusBookId: `book:${browsedBookName ?? bookLabel}`, layout, activePath, parentMap, wrapperRef, transformRef });

  return (
    <div ref={wrapperRef} className="relative h-full w-full">
      <TransformWrapper
        minScale={0.05}
        maxScale={3}
        initialScale={1}
        doubleClick={{ mode: "toggle" }}
        onInit={(ref) => (transformRef.current = ref)}
        // Off (the library's own default is on) — a node near the edge of the WHOLE canon-wide
        // tree still needs to land dead-center on screen (see useMindMapAutoCenter.ts's own
        // doc comment), even when that means panning past the tree's own bounding box and
        // revealing a little plain canvas background beyond it. With this on, the library
        // clamps any pan that would do that, silently capping how far off-center that node
        // could ever be shown — exactly the case an edge book/chapter's own auto-center hits.
        limitToBounds={false}
      >

        {({ zoomIn, zoomOut, resetTransform }) => (
          <>
            <MindMapZoomControls onZoomIn={() => zoomIn()} onZoomOut={() => zoomOut()} onReset={() => resetTransform()} />
            <TransformComponent wrapperClass={`!h-full !w-full ${CANVAS_BG_CLASS}`} contentClass="!items-start">
              <div className="relative" style={{ width: layout.width, height: layout.height }}>
                <MindMapLinks layout={layout} isOnFocusedBranch={isOnFocusedBranch} />
                {layout.nodes.map((node) => (
                  <MindMapNodeCard
                    key={node.data.id}
                    datum={node.data}
                    x={node.cx}
                    y={node.cy}
                    expanded={activePath.includes(node.data.id)}
                    // A pericope card never joins activePath (see onSelectPericope) or the CAFD
                    // dimming isOnFocusedBranch drives for every other kind — EVERY pericope
                    // under an expanded chapter always sits on that chapter's own frontier, so
                    // that check alone would never actually dim/shrink one. Its own `status`
                    // stands in instead: full size and bright exactly while it's today's real
                    // lesson, faded and smaller otherwise — same visual language, a signal that
                    // actually varies between siblings. (Shrinking only ever clears MORE room
                    // than lib/mindMapTreeLayout.ts's own PERICOPE_STEP_PX/PERICOPE_SIDE_OFFSET_PX
                    // assume, never less.)
                    dimmed={node.data.kind === "root" ? false : node.data.kind === "pericope" ? node.data.status !== "active" : !isOnFocusedBranch(node.data.id)}
                    sizeScale={node.data.kind === "pericope" ? (node.data.status === "active" ? 1 : INACTIVE_SCALE) : sizeScaleFor(node.data.id)}
                    onActiveChain={isOnActiveChain(node.data.id)}
                    gradientT={gradientTById.get(node.data.id)}
                    onSelectPericope={handleSelectPericope}
                    onToggleNode={toggleNode}
                  />
                ))}
              </div>
            </TransformComponent>
          </>
        )}
      </TransformWrapper>
      {/* Browsing a non-active book (see findBrowsedBook) doesn't switch the reader's real
          active learning path on its own — this is the one explicit action that does, surfaced
          only while there's actually a browsed book to start, positioned with the zoom controls
          rather than inline in the tree so it stays reachable regardless of how far that book's
          own cluster is scrolled/zoomed. */}
      {browsedBookName && (
        <button
          type="button"
          onClick={() => onSwitchBook(browsedBookName)}
          className="absolute left-3 top-3 z-20 rounded-full bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm"
        >
          Start learning {browsedBookName}
        </button>
      )}
    </div>
  );
}
