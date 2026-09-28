"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

export interface FitScale<T extends HTMLElement> {
  contentRef: RefObject<T | null>;
  // 1 whenever the content's own natural height already fits `containerHeightPx`; otherwise
  // the fraction that shrinks it down to exactly fit, with no floor — see this hook's own doc
  // comment on why there's no "too small to read" cutoff.
  scale: number;
}

// The Mind Map lesson sheet's fixed drill zone (see SheetDrillPortal.tsx) must never scroll and
// must never grow past its height (the user's own explicit call) — so whatever a stage's real
// controls need beyond it gets uniformly scaled down to fit instead. Measures the content's own real, UNSCALED height via `scrollHeight` (a CSS
// `transform` never affects layout/scroll metrics, so this stays accurate even while a previous
// scale is already applied) and re-measures on any resize — a stage swap (a fresh
// `LessonControlBar` per `stageKey`) is exactly a resize of this same element. No minimum
// scale floor: this box must never scroll or resize, full stop, even if that means shrinking
// content further than would ideally stay legible. A container height of 0 (a content-sized
// zone that hasn't laid out yet) means "unconstrained", not "shrink to nothing".
export function useFitScale<T extends HTMLElement>(containerHeightPx: number | null): FitScale<T> {
  const contentRef = useRef<T>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = contentRef.current;
    if (!el || !containerHeightPx) return;
    function measure() {
      if (!el || !containerHeightPx) return;
      const naturalHeight = el.scrollHeight;
      setScale(naturalHeight > containerHeightPx ? Math.max(containerHeightPx / naturalHeight, 0.01) : 1);
    }
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [containerHeightPx]);

  return { contentRef, scale };
}
