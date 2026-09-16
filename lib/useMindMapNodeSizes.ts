"use client";

import { useLayoutEffect, useState, type RefObject } from "react";
import type { MindMapLayout } from "@/lib/mindMapTreeLayout";

export interface MindMapNodeSize {
  width: number;
  height: number;
}

// Real per-node CSS sizes for every content-sized (not fixed-diameter) shape on the canvas — a
// pericope card (min-w-20 to max-w-[150px]) and a theme pill (min-w-[72px] to max-w-[118px],
// plus a variable one-or-two-line label and an optional caption line) — see
// MindMapLinks.tsx's own doc comment on why these need measuring rather than one fixed guess: a
// single approximation generous enough to clear the widest realistic label was never tight
// enough for a shorter one's own real edge, and vice versa. A plain ring/root circle skips this
// entirely — RING_SIZE_PX/ROOT_HALF_SIZE_PX are already exact, not approximations. offsetWidth/
// offsetHeight read the element's own pre-transform layout box — unaffected by either this
// node's own CAFD scale() (MindMapNodeCard.tsx's `sizeScale`) or the canvas's outer pan/zoom
// transform (both are CSS transforms, not real layout), so they're already in the same
// untransformed "layout space" unit system layout.nodes' own (cx, cy) use, with no extra unit
// conversion needed. Re-measured whenever `layout` itself changes (a different set of nodes is
// on screen) — not on every render.
export function useMindMapNodeSizes(containerRef: RefObject<HTMLDivElement | null>, layout: MindMapLayout): Map<string, MindMapNodeSize> {
  const [sizes, setSizes] = useState<Map<string, MindMapNodeSize>>(new Map());

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const next = new Map<string, MindMapNodeSize>();
    container.querySelectorAll<HTMLElement>("[data-node-id]").forEach((el) => {
      const id = el.dataset.nodeId;
      if (id) next.set(id, { width: el.offsetWidth, height: el.offsetHeight });
    });
    setSizes(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- containerRef's own identity is stable; layout is the real trigger
  }, [layout]);

  return sizes;
}
