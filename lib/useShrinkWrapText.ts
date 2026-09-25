"use client";

import { useLayoutEffect, useRef } from "react";

// Wrapped text keeps its box at its full max-width even when every line is shorter, leaving a
// gap beside it. This finds the widest line actually drawn and narrows the element to it —
// through the `--shrink-wrap-width` CSS variable, which the element's class reads (e.g.
// `w-[var(--shrink-wrap-width,auto)]`) — so a wrapped heading's box hugs its text. Unwrapped text
// is left to size itself.
//
// Measured on an invisible, untransformed copy of the element (same classes, same text, same
// max-width) rather than the element itself: a Mind Map card sits inside a zoomed canvas and grows
// in from scale 0, so its own on-screen line boxes can be scaled or zero-sized.
export function useShrinkWrapText<T extends HTMLElement>(text: string) {
  const ref = useRef<T>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.removeProperty("--shrink-wrap-width");
    const probe = el.cloneNode(true) as HTMLElement;
    probe.style.cssText = "position:absolute;left:-10000px;top:0;visibility:hidden;pointer-events:none";
    document.body.appendChild(probe);
    const range = document.createRange();
    range.selectNodeContents(probe);
    const lines = Array.from(range.getClientRects());
    const wrapped = new Set(lines.map((rect) => Math.round(rect.top))).size > 1;
    const widest = Math.max(0, ...lines.map((rect) => rect.width));
    probe.remove();
    if (wrapped && widest > 0) el.style.setProperty("--shrink-wrap-width", `${Math.ceil(widest) + 1}px`);
  }, [text]);

  return ref;
}
