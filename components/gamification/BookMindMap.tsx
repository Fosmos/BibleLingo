"use client";

import { useMemo, useRef, useState } from "react";
import { TransformWrapper, TransformComponent, type ReactZoomPanPinchRef } from "react-zoom-pan-pinch";
import type { ChapterNode } from "@/lib/useMindMapData";
import { buildMindMapTree, type MindMapPericopeDatum } from "@/lib/mindMapHierarchy";
import { computeMindMapLayout } from "@/lib/mindMapTreeLayout";
import { isPericopeNode } from "@/lib/mindMapLayoutTypes";
import { mapPinTarget, nextPathVerse, pinVerseNumber, pinnedRingId, todaysLessonVerseKeys, treePericopes } from "@/lib/mindMapVerseStream";
import { buildParentMap, defaultActivePath, toggleActivePath, findBrowseTarget } from "@/lib/mindMapActivePath";
import { useMindMapAutoCenter } from "@/lib/useMindMapAutoCenter";
import { useMindMapNodeSizes } from "@/lib/useMindMapNodeSizes";
import { useMindMapFocusState, INACTIVE_SCALE } from "@/lib/useMindMapFocusState";
import { useMindMapBrowseChapter } from "@/lib/useMindMapBrowseChapter";
import { useMindMapPericopeZoomLock } from "@/lib/useMindMapPericopeZoomLock";
import { useMindMapVerseFocusLock } from "@/lib/useMindMapVerseFocusLock";
import { useMindMapLocate } from "@/lib/useMindMapLocate";
import { useYesterdayReview } from "@/lib/useYesterdayReview";
import { useMindMapFollowFocusBranch } from "@/lib/useMindMapFollowFocusBranch";
import { useMindMapLessonLearnedTree } from "@/lib/mindMapLessonLearnedTree";
import { useMindMapCompletionCelebration } from "@/lib/useMindMapCompletionCelebration";
import { buildMindMapSelectionHandlers } from "@/lib/mindMapSelectionHandlers";
import type { PathTarget } from "@/lib/mindMapPathTarget";
import { useProgressStore } from "@/store/useProgressStore";
import { NO_LOCATION_TAG_LEVELS } from "@/lib/locationTags";
import { CANVAS_BG_CLASS } from "@/lib/mindMapGenreColor";
import { playMindMapTapSfx } from "@/lib/audio";
import { MindMapNodeCard } from "@/components/gamification/MindMapNodeCard";
import { MindMapZoomControls } from "@/components/gamification/MindMapZoomControls";
import { MindMapLinks } from "@/components/gamification/MindMapLinks";
import { MindMapTerritories } from "@/components/gamification/MindMapTerritories";
import { MindMapVerseStream } from "@/components/gamification/MindMapVerseStream";

interface BookMindMapProps {
  // The path drawn (lib/useMindMapData.ts), null on the bare canon — inside opens lessons, outside offers a path.
  pathKey: string | null;
  bookLabel: string;
  chapters: ChapterNode[];
  completedDays: number;
  todaysDay: number;
  version: string;
  // A hall card's tap opens its chapter's reading view; a verse chip's fallback when the next prop is unset.
  onSelectChapter: (chapter: number, startVerse?: number) => void;
  // A verse chip's own tap on the ACTIVE book — opens the verse preview tab
  // (BookMindMapWithLessonSheet.tsx), instead of navigating to the chapter view. Optional —
  // omitting it keeps every verse chip tap on the plain chapter-view nav.
  onSelectVerseForLesson?: (pericope: MindMapPericopeDatum, verseNumber: number) => void;
  // The verse currently being drilled inside the in-place lesson sheet, if any — zooms/centers
  // the canvas on it (lib/useMindMapVerseFocusLock.ts), opening its chapter first if needed
  // (lib/useMindMapFollowFocusBranch.ts), and pins its own chip below.
  focusVerse?: { book?: string; chapter: number; verseNumber: number };
  // Offers a tapped book/chapter/verse outside the active path as a new one (mindMapSelectionHandlers.ts).
  onChoosePath: (target: PathTarget) => void;
  // Any chapter ring tapped (opened or closed) — offers its review (lib/useMindMapReviewOffer.ts).
  onTapChapter?: (book: string, chapter: number) => void;
}

// A free pan/zoom canvas of the WHOLE canon's Bible -> Testament -> Genre -> Book -> Chapter ->
// Pericope tree, laid out top-down like a table of contents (see lib/mindMapTreeLayout.ts). The
// drawn path's chapters are real; any other chapter opens for browsing, fetched on demand
// (lib/useMindMapBrowseChapter.ts), and opening anything outside the path offers it as a new one. First paint centers on the active book (useMindMapAutoCenter.ts).
// react-zoom-pan-pinch pans/zooms it (vertical-scroll-only while a CHAPTER is open — see
// lib/useMindMapPericopeZoomLock.ts); nodes are plain absolutely-positioned HTML cards.
//
// Contextual Accordion Focus-Dimming (CAFD): the canvas holds exactly ONE open branch at a time
// — `activePath` (see lib/mindMapActivePath.ts). Exclusivity is enforced at EVERY depth: opening
// any node collapses whichever sibling used to be open at that same level, and everything below
// it — see toggleActivePath's own doc comment. Every node/link neither ON that path NOR one of
// the deepest active node's own real children dims to 25% opacity (see MindMapNodeCard.tsx's own
// `dimmed` prop and this file's own link rendering below, both via isOnFocusedBranch).
export function BookMindMap({ pathKey, bookLabel, chapters, completedDays, todaysDay, version, onSelectChapter, onSelectVerseForLesson, focusVerse, onChoosePath, onTapChapter }: BookMindMapProps) {
  const paths = useProgressStore((state) => state.paths);
  const entities = useProgressStore((state) => state.memorizedEntities);
  const locationTagLevels = useProgressStore((state) => state.locationTagLevels) ?? NO_LOCATION_TAG_LEVELS;
  // Starts (and resets, on a book change) with just the branch down to today's lesson open.
  const homePath = useMemo(() => defaultActivePath(bookLabel, chapters), [bookLabel, chapters]);
  const [activePath, setActivePath] = useState<string[]>(homePath);
  const [expandedResetKey, setExpandedResetKey] = useState(bookLabel);
  if (bookLabel !== expandedResetKey) {
    setExpandedResetKey(bookLabel);
    setActivePath(homePath);
  }

  // Which OTHER book/chapter is open for structural browsing (lib/useMindMapBrowseChapter.ts).
  const { browsedBookName, browsedChapter } = findBrowseTarget(activePath, bookLabel, chapters);
  const browseTick = useMindMapBrowseChapter(browsedBookName, browsedChapter ?? null, version);

  const builtTree = useMemo(
    () => buildMindMapTree(paths, bookLabel, chapters, completedDays, todaysDay, browsedBookName ?? undefined, browsedChapter, entities),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- browseTick is a pure "re-read the cache" nudge, not a real input
    [paths, entities, bookLabel, chapters, completedDays, todaysDay, browsedBookName, browsedChapter, browseTick],
  );
  const tree = useMindMapLessonLearnedTree(builtTree, chapters, pathKey);
  const parentMap = useMemo(() => buildParentMap(tree), [tree]);
  const layout = useMemo(() => computeMindMapLayout(tree, new Set(activePath)), [tree, activePath]);
  const { isOnFocusedBranch, sizeScaleFor } = useMindMapFocusState(activePath, parentMap);
  const { celebratingChapterId, celebratingBookId } = useMindMapCompletionCelebration(layout);
  // The chapter currently selected (activePath's own deepest entry, if it's a chapter) — every
  // one of ITS pericopes is already unrolled the instant it's open (lib/mindMapPericopeSpine.ts),
  // which is also exactly when the canvas locks to a vertical-scroll reading column.
  const deepestNode = layout.nodes.find((node) => node.data.id === activePath[activePath.length - 1]);
  const expandedChapterId = deepestNode?.data.kind === "chapter" ? deepestNode.data.id : null;

  useMindMapFollowFocusBranch({ focusVerse, tree, activePath, setActivePath });
  const todayVerseKeys = useMemo(() => todaysLessonVerseKeys(bookLabel, chapters, todaysDay, focusVerse), [bookLabel, chapters, todaysDay, focusVerse]);
  // The pin steps back to yesterday's verses while today's lesson still owes their review, and on
  // to the next lesson's verses once today's is done (lib/useYesterdayReview.ts, nextPathVerse).
  const yesterday = useYesterdayReview(pathKey, useMemo(() => chapters.flatMap((chapter) => chapter.days), [chapters]), completedDays, todaysDay);
  const nextVerse = yesterday.first ?? (bookLabel && completedDays >= todaysDay ? nextPathVerse(bookLabel, chapters, completedDays) : undefined);
  const pinTarget = mapPinTarget(treePericopes(tree), focusVerse, todayVerseKeys, nextVerse, bookLabel ? nextPathVerse(bookLabel, chapters, Math.max(completedDays, todaysDay)) : undefined);
  const pinnedId = pinnedRingId(pinTarget, layout, parentMap);

  const { onSelectPericope, onSelectVerse, onOpenRing } = buildMindMapSelectionHandlers(pathKey, onSelectChapter, onSelectVerseForLesson, onChoosePath);

  function toggleNode(id: string) {
    playMindMapTapSfx();
    const opening = !activePath.includes(id);
    setActivePath((prev) => toggleActivePath(tree, prev, id));
    const datum = layout.nodes.find((node) => node.data.id === id)?.data;
    if (datum && opening) onOpenRing(datum);
    if (datum?.kind === "chapter") onTapChapter?.(datum.book, datum.chapter);
  }

  const wrapperRef = useRef<HTMLDivElement>(null);
  const transformRef = useRef<ReactZoomPanPinchRef | null>(null);
  useMindMapAutoCenter({ focusBookId: `book:${browsedBookName ?? bookLabel}`, layout, activePath, parentMap, wrapperRef, transformRef });
  const nodeSizeById = useMindMapNodeSizes(wrapperRef, layout);
  // Called AFTER useMindMapAutoCenter so a selection's own tighter framing always wins.
  const { isLocked, gestureProps, maxScale } = useMindMapPericopeZoomLock({ expandedChapterId, layout, wrapperRef, transformRef });
  // Called AFTER the two hooks above so a focused verse's own tighter framing always wins.
  useMindMapVerseFocusLock({ focusVerse, layout, wrapperRef, transformRef });
  const locate = useMindMapLocate({ homePath, setActivePath, pinTarget, layout, wrapperRef, transformRef });

  return (
    <div ref={wrapperRef} className="relative h-full w-full">
      <TransformWrapper
        minScale={0.05}
        maxScale={maxScale}
        initialScale={1}
        onInit={(ref) => (transformRef.current = ref)}
        // Off (the library's own default is on) — an edge node still needs to land dead-center on
        // screen (see useMindMapAutoCenter.ts) even past the tree's bounding box; ON would clamp that.
        limitToBounds={false}
        // A vertical-scroll-only locked reading column while a chapter is selected, the ordinary
        // free pan/pinch/zoom canvas otherwise — see useMindMapPericopeZoomLock.ts.
        {...gestureProps}
      >
        {({ zoomIn, zoomOut, setTransform }) => (
          <>
            {/* Reset brings "The Bible" back to the top-center at 1x (the canvas is anchored far from its corner). */}
            <MindMapZoomControls onZoomIn={() => zoomIn()} onZoomOut={() => zoomOut()} onReset={() => setTransform((wrapperRef.current?.clientWidth ?? 0) / 2 - (layout.nodes[0]?.cx ?? 0), 110 - (layout.nodes[0]?.cy ?? 0), 1)} onLocate={bookLabel ? locate : undefined} hideZoomButtons={isLocked} />
            <TransformComponent wrapperClass={`!h-full !w-full ${CANVAS_BG_CLASS}`} contentClass="!items-start">
              <div className="relative" style={{ width: layout.width, height: layout.height }}>
                <MindMapTerritories layout={layout} parentMap={parentMap} />
                <MindMapLinks layout={layout} isOnFocusedBranch={isOnFocusedBranch} activePath={activePath} nodeSizeById={nodeSizeById} />
                {layout.nodes.map((node) => (
                  <MindMapNodeCard
                    key={node.data.id}
                    datum={node.data}
                    x={node.cx}
                    y={node.cy}
                    expanded={activePath.includes(node.data.id)}
                    // Pericope/root cards never dim — a pericope's own progress reads through
                    // its spine segments now (see lib/mindMapPericopeSpine.ts), not by fading
                    // the card itself.
                    dimmed={node.data.kind === "root" || node.data.kind === "pericope" ? false : !isOnFocusedBranch(node.data.id)}
                    sizeScale={node.data.kind === "pericope" ? INACTIVE_SCALE : sizeScaleFor(node.data.id)}
                    measuredSize={nodeSizeById.get(node.data.id)}
                    hallNumber={node.hallNumber}
                    onSelectPericope={onSelectPericope}
                    onToggleNode={toggleNode}
                    locationTagLevels={locationTagLevels}
                    celebrating={node.data.id === celebratingChapterId || node.data.id === celebratingBookId}
                    celebratingBookTier={node.data.id === celebratingBookId}
                    pinned={node.data.id === pinnedId}
                  />
                ))}
                {/* Every pericope under the open chapter unrolls at once (lib/mindMapPericopeSpine.ts). */}
                {layout.nodes.filter(isPericopeNode).map((node) => (
                    <MindMapVerseStream
                      key={node.data.id}
                      pericope={node.data}
                      verseChips={layout.verseChips.filter((chip) => chip.pericopeId === node.data.id)}
                      hallNumber={node.hallNumber}
                      emblem={node.emblem}
                      pinVerseNumber={pinVerseNumber(node.data, pinTarget)}
                      todayVerseKeys={todayVerseKeys}
                      reviewDueKeys={yesterday.verseKeys}
                      onSelectVerse={(_chapter, verseNumber) => onSelectVerse(node.data, verseNumber)}
                    />
                  ))}
              </div>
            </TransformComponent>
          </>
        )}
      </TransformWrapper>
    </div>
  );
}
