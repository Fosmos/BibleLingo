"use client";

import { useEffect, useLayoutEffect, type RefObject } from "react";
import type { ReactZoomPanPinchProps, ReactZoomPanPinchRef } from "react-zoom-pan-pinch";
import type { MindMapLayout } from "@/lib/mindMapTreeLayout";
import { PERICOPE_WAVE_AMPLITUDE_PX } from "@/lib/mindMapPericopeSpine";
import { MAX_SWEEP_PX } from "@/lib/mindMapHallGeometry";

type MindMapGestureProps = Pick<ReactZoomPanPinchProps, "doubleClick" | "panning" | "pinch" | "wheel">;

// The ordinary free canvas's own gestures, vs. the locked-in reading column (see this file's
// own top doc comment below) — spread straight onto BookMindMap.tsx's own TransformWrapper.
const FREE_GESTURES: MindMapGestureProps = { doubleClick: { mode: "toggle" } };
// Wheel is disabled here (its own DEFAULT behavior is to zoom, not scroll — there's no built-in
// "wheel pans instead" mode) so it can't zoom the lock back open; this hook's own native wheel
// listener below (see the effect near the bottom) converts the SAME wheel/trackpad scroll into
// vertical panning instead, so a mouse wheel or trackpad still scrolls the pericope column, it
// just never zooms it.
const LOCKED_GESTURES: MindMapGestureProps = {
  doubleClick: { disabled: true },
  panning: { lockAxisX: true },
  pinch: { disabled: true },
  wheel: { disabled: true },
};

// A typical pericope card's width — cards size to their one-line heading (see
// MindMapPericopeGateway.tsx), so this is an estimate, not a cap. Combined with
// lib/mindMapPericopeSpine.ts's PERICOPE_WAVE_AMPLITUDE_PX it gives the width the locked view
// fits to the screen; an unusually long heading just runs a little past it.
const CARD_WIDTH_ESTIMATE_PX = 150;
// The winding verse path (lib/mindMapHallGeometry.ts) swings wider than a card: whichever is wider,
// plus a verse circle's half-width at the edge of each swing.
const COLUMN_WIDTH_PX = Math.max(CARD_WIDTH_ESTIMATE_PX, (MAX_SWEEP_PX + 16) * 2) + PERICOPE_WAVE_AMPLITUDE_PX * 2;
// How much of the real viewport WIDTH that whole column should fill once locked in — modest and
// deliberately NOT a close-up: unlike the old one-pericope-at-a-time accordion, this view now has
// to stay legible while showing every pericope in the chapter at once — close enough that the
// chips read clearly on a phone, with room either side for the verse trail's own swing.
// Raised from 0.55 once COLUMN_WIDTH_PX began measuring the winding path's full swing, not just a card.
const LOCKED_WIDTH_FRACTION = 0.9;
const LOCKED_MAX_SCALE = 2.2;
// The free canvas's own usual cap (BookMindMap.tsx's own prior fixed `maxScale={3}`) is fine as
// the locked ceiling too now that locked mode itself leans zoomed out — LOCKED_MAX_SCALE above
// only ever matters for an unusually narrow chapter. Exported so BookMindMap.tsx's own
// TransformWrapper `maxScale` prop always matches whatever this hook is actually targeting.
export const DEFAULT_MAX_SCALE = 3;
// Where the chapter node itself lands vertically once locked — near the TOP of the viewport
// (not centered), so the whole column's real content (every pericope card and its own verse
// chain) has room to unroll downward into view as the reader scrolls, "old path view" style.
const TOP_ANCHOR_FRACTION = 0.12;

interface UseMindMapPericopeZoomLockArgs {
  // The chapter currently selected/open, or null — see BookMindMap.tsx, which derives this from
  // `activePath`'s own deepest entry. Every pericope under it is already unrolled the instant
  // it's open (see lib/mindMapPericopeSpine.ts), so "a chapter is selected" and "lock the
  // canvas to a scrollable reading column" are the same moment, not two separate triggers.
  expandedChapterId: string | null;
  layout: MindMapLayout;
  wrapperRef: RefObject<HTMLDivElement | null>;
  transformRef: RefObject<ReactZoomPanPinchRef | null>;
}

interface MindMapPericopeZoomLock {
  // True while a chapter is selected — BookMindMap.tsx uses this to lock the TransformWrapper's
  // own panning to the vertical axis only and disable pinch/wheel/double-click zoom, so the
  // reader can only scroll up/down through every pericope's own verse stream, never drift
  // sideways or pinch back out mid-recitation — the same single-column feel the old path view
  // always had.
  isLocked: boolean;
  // Spread straight onto TransformWrapper — FREE_GESTURES/LOCKED_GESTURES above.
  gestureProps: MindMapGestureProps;
  // TransformWrapper's own `maxScale` prop — DEFAULT_MAX_SCALE/LOCKED_MAX_SCALE above.
  maxScale: number;
}

// Re-frames the canvas the instant a chapter is selected — zoomed and centered so the WHOLE
// pericope column (see COLUMN_WIDTH_PX above) fits within LOCKED_WIDTH_FRACTION of the real
// screen width, anchored near the top so scrolling down reveals the rest — then left locked
// there by the caller's own panning/pinch/wheel props. A no-op while no chapter is selected:
// lib/useMindMapAutoCenter.ts's own effect already re-runs and re-frames the canvas normally the
// instant `expandedChapterId` clears (its own `layout` dependency changes every time a chapter
// opens/closes — see lib/mindMapTreeLayout.ts's own computeMindMapLayout), so nothing extra is
// needed here for collapsing. Must be called AFTER useMindMapAutoCenter in BookMindMap.tsx so its
// own layout effect always runs second and wins on the same selection.
export function useMindMapPericopeZoomLock({ expandedChapterId, layout, wrapperRef, transformRef }: UseMindMapPericopeZoomLockArgs): MindMapPericopeZoomLock {
  useLayoutEffect(() => {
    if (!expandedChapterId) return;
    const wrapper = wrapperRef.current;
    const transform = transformRef.current;
    if (!wrapper || !transform) return;
    const chapterNode = layout.nodes.find((candidate) => candidate.data.id === expandedChapterId);
    if (!chapterNode) return;
    const rect = wrapper.getBoundingClientRect();
    const scale = Math.min(LOCKED_MAX_SCALE, (rect.width * LOCKED_WIDTH_FRACTION) / COLUMN_WIDTH_PX);
    // Instant (0ms), never animated — same reason useMindMapAutoCenter.ts's own call is instant:
    // selecting a chapter changes the content div's real size (every pericope's own verse stream
    // mounting at once), and the library's own ResizeObserver unconditionally cancels an
    // in-flight animated setTransform in favor of its own resize handling the moment that fires,
    // landing nowhere near this target.
    transform.setTransform(rect.width / 2 - chapterNode.cx * scale, rect.height * TOP_ANCHOR_FRACTION - chapterNode.cy * scale, scale, 0);
  }, [expandedChapterId, layout, wrapperRef, transformRef]);

  const isLocked = expandedChapterId !== null;

  // A plain JSX `onWheel` prop is a PASSIVE listener in React (registered that way since React
  // 17, for scroll performance) — `event.preventDefault()` inside one is a silent no-op that
  // logs "Unable to preventDefault inside passive event listener invocation" to the console
  // instead of actually blocking the library's own default wheel-zoom. A real, imperative
  // `addEventListener("wheel", ..., { passive: false })` is the only way to actually intercept
  // it. Only attached while locked — unlocked, the library's own normal wheel-zoom handles it.
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper || !isLocked) return;
    function handleWheel(event: WheelEvent) {
      // Vertical only — deltaX (a trackpad's own horizontal swipe component) is dropped
      // entirely, the same axis lock `panning.lockAxisX` already applies to a touch/mouse drag.
      event.preventDefault();
      // Instant (0ms) — an eased 200ms default per tick reads as laggy/rubbery under a rapid
      // stream of wheel events; a plain scroll should track the wheel immediately.
      void transformRef.current?.panBy(0, -event.deltaY, 0);
    }
    wrapper.addEventListener("wheel", handleWheel, { passive: false });
    return () => wrapper.removeEventListener("wheel", handleWheel);
  }, [isLocked, wrapperRef, transformRef]);

  return {
    isLocked,
    gestureProps: isLocked ? LOCKED_GESTURES : FREE_GESTURES,
    maxScale: isLocked ? LOCKED_MAX_SCALE : DEFAULT_MAX_SCALE,
  };
}
