"use client";

import { useLayoutEffect, useState, type RefObject } from "react";
import type { VerseSpotlightTargets } from "@/lib/verseSpotlightTargets";

export interface MindMapCompactTransform {
  offsetX: number;
  offsetY: number;
  scale: number;
}

// How much of the wrapper's own real box the target points' bounding box should fill — well
// under 1 (unlike the real canvas's own FOCUS_FILL_FRACTION) so the before/after neighbor nodes
// land clearly inside the frame, not brushing its edge, per the confirmed "well in frame"
// requirement.
const FIT_FRACTION = 0.6;
// Caps how close a single isolated verse (no before/after neighbor — the chapter's own first or
// last pericope) can zoom in, since its own bounding box collapses toward a single point.
const MAX_SCALE = 1.6;

// Mirrors the exact fit-and-anchor formula lib/useMindMapAutoCenter.ts/
// lib/useMindMapPericopeZoomLock.ts already use on the real Mind Map canvas (measure the
// wrapper's real on-screen box, fit the target points' bounding box into a fraction of it,
// anchor the CURRENT verse to the wrapper's own screen center) — adapted for a plain CSS
// transform on a small, fixed-height wrapper instead of an imperative react-zoom-pan-pinch
// `setTransform` call, since this compact spotlight has no pan/zoom instance of its own (see
// LearnMindMapSpotlight.tsx). `targets` must be a referentially-stable object (memoized by the
// caller, keyed on the real verse/chapter inputs) — a fresh object every render would re-run
// this effect every render.
export function useMindMapCompactCenter(wrapperRef: RefObject<HTMLDivElement | null>, targets: VerseSpotlightTargets | undefined): MindMapCompactTransform | null {
  const [transform, setTransform] = useState<MindMapCompactTransform | null>(null);

  useLayoutEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper || !targets) return;

    function recompute() {
      if (!wrapper || !targets) return;
      const rect = wrapper.getBoundingClientRect();
      const points = [targets.current, targets.before, targets.after].filter((point): point is { x: number; y: number } => point !== undefined);
      const xs = points.map((point) => point.x);
      const ys = points.map((point) => point.y);
      const width = Math.max(...xs) - Math.min(...xs) || 1;
      const height = Math.max(...ys) - Math.min(...ys) || 1;
      const scale = Math.min(MAX_SCALE, (rect.width * FIT_FRACTION) / width, (rect.height * FIT_FRACTION) / height);
      setTransform({ offsetX: rect.width / 2 - targets.current.x * scale, offsetY: rect.height / 2 - targets.current.y * scale, scale });
    }

    recompute();
    const observer = new ResizeObserver(recompute);
    observer.observe(wrapper);
    return () => observer.disconnect();
  }, [wrapperRef, targets]);

  return transform;
}
