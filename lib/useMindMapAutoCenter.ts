"use client";

import { useLayoutEffect, type RefObject } from "react";
import type { ReactZoomPanPinchRef } from "react-zoom-pan-pinch";
import type { MindMapLayout } from "@/lib/mindMapTreeLayout";

// How much of the REAL measured viewport the open branch's own local cluster should fill — a
// fraction of the actual wrapper size, not a fixed pixel target. A fixed target (an earlier
// version of this used one, 640px) looks fine on a phone-sized viewport but reads as a tiny,
// lost cluster adrift in a sea of empty canvas on a wide desktop window, since it never adapted
// to how much real room was actually available. Capped at 1 (never scaled up past its own
// natural size) so a book with only a few chapters doesn't start zoomed in absurdly close just
// because the window happens to be small.
const FOCUS_FILL_FRACTION = 0.82;

interface UseMindMapAutoCenterArgs {
  // Which book node to fall back to centering on before anything's ever been tapped — the real
  // active book's own id most of the time, but whichever OTHER book is currently being browsed
  // instead once the reader's opened one (see BookMindMap.tsx's own findBrowsedBook).
  focusBookId: string;
  layout: MindMapLayout;
  activePath: string[];
  parentMap: Map<string, string>;
  wrapperRef: RefObject<HTMLDivElement | null>;
  transformRef: RefObject<ReactZoomPanPinchRef | null>;
}

// Re-centers/zooms BookMindMap.tsx's own canvas every time the open branch changes, so the
// reader is never left having to hunt-and-pan to see what a tap just revealed. One framing for
// every node kind (chapter included, same as book/testament/genre/subgenre/theme — the default
// view opens straight to today's own chapter, see defaultActivePath): centers on whichever node
// was just tapped, zoomed so the row it's currently offering (every real child hanging directly
// off it — the choices a tap would pick between right now) fits on screen too.
//
// Always an instant jump, never an animated pan — react-zoom-pan-pinch's own ResizeObserver
// watches the content div's real size (see its `handleResizeAlignment`), and expanding or
// collapsing a node changes that size almost every time (a fresh row of children mounts or
// unmounts). Whenever that fires while OUR OWN animated `setTransform` is still mid-flight, the
// library unconditionally cancels it in favor of its own resize handling, regardless of any prop
// — so an animated call here would silently get cut off a few milliseconds in and land nowhere
// near its real target. An instant (0ms) call applies its target synchronously instead, with no
// in-flight animation left for that cancellation to ever catch.
//
// Pulled out of BookMindMap.tsx into its own hook purely to keep that component under this
// codebase's own 200-line file cap (see CLAUDE.md) — no behavior difference from having it
// inline.
export function useMindMapAutoCenter({ focusBookId, layout, activePath, parentMap, wrapperRef, transformRef }: UseMindMapAutoCenterArgs): void {
  // useLayoutEffect (not useEffect) so the very first paint already shows the corrected
  // transform instead of flashing at the library's own scale-1 default first.
  useLayoutEffect(() => {
    const wrapper = wrapperRef.current;
    const transform = transformRef.current;
    if (!wrapper) return;
    const bookNode = layout.nodes.find((node) => node.data.id === focusBookId);
    if (!bookNode || !transform) return;
    const deepestId = activePath[activePath.length - 1] ?? bookNode.data.id;
    // The node actually just expanded — this framing centers ON this node (not the book), so
    // tapping any node always brings IT to the middle of the screen, book, chapter, or ten
    // levels deeper. Falls back to the book itself before anything's ever been tapped.
    const deepestNode = layout.nodes.find((node) => node.data.id === deepestId) ?? bookNode;
    const rect = wrapper.getBoundingClientRect();

    // The tight cluster actually worth fitting is the deepest node plus the open branch's own
    // frontier — not every sibling chapter circle a many-chapter book fans out into. A many-
    // chapter book's own chapter row fans out very wide (one circle per chapter — see
    // lib/mindMapTreeLayout.ts's fixed sibling spacing), while its real height stays just a
    // couple of rows; fitting THAT whole row would force the scale down to whatever a book's own
    // chapter COUNT demands, which reads as a tiny, adrift cluster on any viewport whose own
    // aspect ratio doesn't happen to match a wide, short rectangle (a phone in portrait, most of
    // all). Collapsed branches' own circles are still right there at their own fixed positions
    // either way — panning reveals them, same as before.
    const activeIds = new Set(activePath);
    const focusNodes = layout.nodes.filter((node) => activeIds.has(node.data.id) || parentMap.get(node.data.id) === deepestId);
    // Falls back to just the deepest node itself only if it somehow has no direct children yet
    // (shouldn't normally happen for a real in-progress book) — better than fitting nothing at
    // all.
    const localNodes = focusNodes.length > 0 ? focusNodes : [deepestNode];
    const xs = localNodes.map((node) => node.cx);
    const ys = localNodes.map((node) => node.cy);
    const localWidth = Math.max(...xs) - Math.min(...xs) || 1;
    const localHeight = Math.max(...ys) - Math.min(...ys) || 1;
    const scale = Math.min(1, (rect.width * FOCUS_FILL_FRACTION) / localWidth, (rect.height * FOCUS_FILL_FRACTION) / localHeight);
    transform.setTransform(rect.width / 2 - deepestNode.cx * scale, rect.height / 2 - deepestNode.cy * scale, scale, 0);
  }, [activePath, layout, parentMap, focusBookId, wrapperRef, transformRef]);
}
