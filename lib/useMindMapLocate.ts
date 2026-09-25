"use client";

import { useCallback, useLayoutEffect, useRef, useState, type Dispatch, type RefObject, type SetStateAction } from "react";
import type { ReactZoomPanPinchRef } from "react-zoom-pan-pinch";
import type { MindMapLayout } from "@/lib/mindMapTreeLayout";
import { isPericopeNode } from "@/lib/mindMapLayoutTypes";

interface UseMindMapLocateArgs {
  // The branch down to today's lesson (see lib/mindMapActivePath.ts's defaultActivePath).
  homePath: string[];
  setActivePath: Dispatch<SetStateAction<string[]>>;
  // Where the reader is on their path — the verse the "you are here" pin marks (see
  // lib/mindMapVerseStream.ts's mapPinTarget). Undefined without one.
  pinTarget: { book?: string; chapter: number; verseNumber: number } | undefined;
  layout: MindMapLayout;
  wrapperRef: RefObject<HTMLDivElement | null>;
  transformRef: RefObject<ReactZoomPanPinchRef | null>;
}

// Where on the screen the located verse lands — a little above center, leaving the path ahead of
// it in view below.
const TARGET_HEIGHT_FRACTION = 0.4;

// The Mind Map's "back to my place" action (MindMapZoomControls.tsx's locate button): reopens the
// branch down to today's lesson and brings the pinned verse into view — however far the reader has
// wandered around the canon. Runs after the chapter's own framing (lib/useMindMapPericopeZoomLock.ts)
// has settled, keeping its zoom and just moving to the verse; must be called after that hook.
export function useMindMapLocate({ homePath, setActivePath, pinTarget, layout, wrapperRef, transformRef }: UseMindMapLocateArgs): () => void {
  const [request, setRequest] = useState(0);
  const handledRef = useRef(0);

  useLayoutEffect(() => {
    if (request === handledRef.current) return;
    const wrapper = wrapperRef.current;
    const transform = transformRef.current;
    if (!wrapper || !transform || !pinTarget) return;
    const hall = layout.nodes.filter(isPericopeNode).find((node) => node.data.chapter === pinTarget.chapter && (!pinTarget.book || node.data.book === pinTarget.book));
    const chip = hall && layout.verseChips.find((candidate) => candidate.pericopeId.startsWith(`pericope:${hall.data.book}:${pinTarget.chapter}:`) && candidate.verseNumber === pinTarget.verseNumber);
    if (!chip) return;
    handledRef.current = request;
    const rect = wrapper.getBoundingClientRect();
    const scale = transform.state.scale;
    // Sideways, the chapter's column stays centered (as it's framed on opening); only the height
    // moves to the verse.
    const chapterNode = layout.nodes.find((node) => node.data.id === `chapter:${hall.data.book}:${pinTarget.chapter}`);
    const centerX = chapterNode?.cx ?? chip.x;
    transform.setTransform(rect.width / 2 - centerX * scale, rect.height * TARGET_HEIGHT_FRACTION - chip.y * scale, scale, 0);
  }, [request, layout, pinTarget, wrapperRef, transformRef]);

  return useCallback(() => {
    setActivePath(homePath);
    setRequest((count) => count + 1);
  }, [homePath, setActivePath]);
}
