"use client";

import { useLayoutEffect, useRef, type RefObject } from "react";
import type { ReactZoomPanPinchRef } from "react-zoom-pan-pinch";
import type { MindMapLayout } from "@/lib/mindMapTreeLayout";
import { isPericopeNode } from "@/lib/mindMapLayoutTypes";
import { findSpotlightTargets } from "@/lib/verseSpotlightTargets";

// The share of the canvas (from the top) left in view above the floating lesson card — the canvas
// itself runs full-screen behind the card (so the map shows all round its edges), and a focused
// verse is framed in this visible strip.
const VISIBLE_TOP_FRACTION = 0.4;
// How long the canvas takes to glide from one verse chip to the next while the sheet stays open.
const GLIDE_MS = 450;

interface UseMindMapVerseFocusLockArgs {
  focusVerse: { book?: string; chapter: number; verseNumber: number } | undefined;
  layout: MindMapLayout;
  wrapperRef: RefObject<HTMLDivElement | null>;
  transformRef: RefObject<ReactZoomPanPinchRef | null>;
}

// Centers (never re-zooms) the REAL Mind Map canvas on one specific verse chip (found with its immediate
// before/after neighbor, with the confirmed neighboring-pericope spillover rule — see
// lib/verseSpotlightTargets.ts's own findSpotlightTargets, reused as-is) whenever
// PathOverviewScreen.tsx's own in-place lesson bottom sheet is open and focused on a verse (see
// store/useLessonSessionStore.ts's own `focusVerse` field — BookMindMap.tsx just forwards it
// through as a prop). Must be called AFTER lib/useMindMapAutoCenter.ts/
// lib/useMindMapPericopeZoomLock.ts in BookMindMap.tsx, same "last call wins" ordering they
// already establish between each other. The FIRST focus (the sheet opening) is instant — the
// canvas's own real height changes (see MindMapScreen.tsx's own `heightClassName`) right when it
// fires, and react-zoom-pan-pinch's own ResizeObserver cancels an in-flight animated
// `setTransform` on a resize, landing nowhere near this target. Every later move with the canvas
// still the same size (a lesson or review advancing verse to verse) glides there instead.
export function useMindMapVerseFocusLock({ focusVerse, layout, wrapperRef, transformRef }: UseMindMapVerseFocusLockArgs): void {
  // The transform this canvas was actually showing right before its own FIRST verse focus —
  // captured once the sheet opens, restored once `focusVerse` clears (the sheet closes), so
  // "Back" returns to exactly what the reader was looking at rather than a freshly recomputed
  // default framing. Neither of the other two zoom-lock hooks above re-runs on its own here —
  // neither depends on `focusVerse` — so without this, closing the sheet just leaves the canvas
  // wherever this hook's own last verse-focus call left it.
  const previousTransformRef = useRef<{ x: number; y: number; scale: number } | null>(null);
  // The wrapper size this hook last framed a verse at — a glide is only safe while it holds.
  const lastSizeRef = useRef<string | null>(null);

  useLayoutEffect(() => {
    const wrapper = wrapperRef.current;
    const transform = transformRef.current;
    if (!wrapper || !transform) return;

    if (!focusVerse) {
      const previous = previousTransformRef.current;
      if (previous) {
        transform.setTransform(previous.x, previous.y, previous.scale, 0);
        previousTransformRef.current = null;
      }
      lastSizeRef.current = null;
      return;
    }
    if (!previousTransformRef.current) {
      const { positionX, positionY, scale } = transform.state;
      previousTransformRef.current = { x: positionX, y: positionY, scale };
    }

    const pericopes = layout.nodes
      .filter(isPericopeNode)
      .filter((node) => node.data.chapter === focusVerse.chapter && (!focusVerse.book || node.data.book === focusVerse.book))
      .map((node) => node.data);
    const targetPericope = pericopes.find(
      (pericope) =>
        pericope.rangeStartVerse !== undefined &&
        pericope.rangeEndVerse !== undefined &&
        focusVerse.verseNumber >= pericope.rangeStartVerse &&
        focusVerse.verseNumber <= pericope.rangeEndVerse,
    );
    if (!targetPericope) return;
    const targets = findSpotlightTargets(pericopes, layout.verseChips, targetPericope.id, focusVerse.verseNumber);
    if (!targets) return;

    const rect = wrapper.getBoundingClientRect();
    const visibleHeight = rect.height * VISIBLE_TOP_FRACTION;
    // The zoom stays exactly as the reader left it — only the view moves, to put the verse in the
    // middle of the strip above the lesson card.
    const scale = transform.state.scale;
    const size = `${Math.round(rect.width)}x${Math.round(rect.height)}`;
    const glide = lastSizeRef.current === size;
    lastSizeRef.current = size;
    transform.setTransform(rect.width / 2 - targets.current.x * scale, visibleHeight / 2 - targets.current.y * scale, scale, glide ? GLIDE_MS : 0, "easeInOutCubic");
  }, [focusVerse, layout, wrapperRef, transformRef]);
}
