"use client";

import { useLayoutEffect, useState, type RefObject } from "react";
import type { MindMapLayout } from "@/lib/mindMapTreeLayout";

// Real per-pericope-card CSS widths (see MindMapNodeCard.tsx's own pericope branch —
// content-sized, min-w-20 to max-w-[150px], never one fixed size) — measured directly via
// offsetWidth rather than guessed, since MindMapLinks.tsx's own link trimming needs each
// card's REAL edge: one fixed half-size guess generous enough to clear the widest realistic
// label left the line stopping visibly short of a narrow one's own real edge (see that file's
// own doc comment). offsetWidth reads the element's own pre-transform layout box — unaffected
// by either this node's own CAFD scale() (MindMapNodeCard.tsx's `sizeScale`) or the canvas's
// outer pan/zoom transform (both are CSS transforms, not real layout), so it's already in the
// same untransformed "layout space" unit system layout.nodes' own (cx, cy) use, with no extra
// unit conversion needed. Re-measured whenever `layout` itself changes (a different set of
// pericope cards is on screen) — not on every render.
export function useMindMapNodeWidths(containerRef: RefObject<HTMLDivElement | null>, layout: MindMapLayout): Map<string, number> {
  const [widths, setWidths] = useState<Map<string, number>>(new Map());

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const next = new Map<string, number>();
    container.querySelectorAll<HTMLElement>("[data-node-id]").forEach((el) => {
      const id = el.dataset.nodeId;
      if (id) next.set(id, el.offsetWidth);
    });
    setWidths(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- containerRef's own identity is stable; layout is the real trigger
  }, [layout]);

  return widths;
}
