"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { useLessonSessionStore } from "@/store/useLessonSessionStore";

// The lesson verse zone (SheetVerseZone.tsx) never scrolls: the verse steps down in size until it
// fits — 21px down to 15 (jumping by √overflow when far over, else 1px at a time), then compact
// spacing (tighter lines and gaps, no ghost lines or stage label), then down to 13px, then it
// stays as it is. Starts over when `fitKey` (the stage and its verses) changes, and on resize.
const START_PX = 21;
const COMPACT_AT_PX = 15;
const FLOOR_PX = 13;

interface Fit {
  key: string;
  fontSizePx: number;
  compact: boolean;
  done: boolean;
}

const fresh = (key: string): Fit => ({ key, fontSizePx: START_PX, compact: false, done: false });

function nextFit(fit: Fit, overflow: number): Fit {
  if (overflow <= 1.002) return { ...fit, done: true };
  if (fit.fontSizePx > COMPACT_AT_PX) {
    const smaller = overflow > 1.4 ? Math.floor(fit.fontSizePx / Math.sqrt(overflow)) : fit.fontSizePx - 1;
    return { ...fit, fontSizePx: Math.max(COMPACT_AT_PX, smaller) };
  }
  if (!fit.compact) return { ...fit, compact: true };
  if (fit.fontSizePx > FLOOR_PX) return { ...fit, fontSizePx: fit.fontSizePx - 1 };
  return { ...fit, done: true };
}

export function useVerseFit(fitKey: string) {
  const ref = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState<Fit>(() => fresh(fitKey));
  const setCompactFit = useLessonSessionStore((state) => state.setVerseCompactFit);
  // A new stage or verse fits from the top again (adjusted during render, as elsewhere here).
  if (fit.key !== fitKey) setFit(fresh(fitKey));

  const step = useCallback(() => {
    const el = ref.current;
    if (el) setFit((current) => (current.done ? current : nextFit(current, el.scrollHeight / Math.max(el.clientHeight, 1))));
  }, []);

  useLayoutEffect(() => {
    if (!fit.done) step();
  }, [fit, step]);

  useLayoutEffect(() => {
    setCompactFit(fit.compact);
  }, [fit.compact, setCompactFit]);
  useLayoutEffect(() => () => setCompactFit(false), [setCompactFit]);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    let width = el.clientWidth;
    let height = el.clientHeight;
    const observer = new ResizeObserver(() => {
      if (el.clientWidth === width && el.clientHeight === height) return;
      // Going compact hides the header's stage label, which hands the zone a little more height.
      // Starting over on that would bring the label back, shrink the zone and go compact again —
      // the verse bouncing up and down for good. A compact fit just keeps the extra room.
      const grewOnly = el.clientWidth === width && el.clientHeight > height;
      width = el.clientWidth;
      height = el.clientHeight;
      setFit((current) => (grewOnly && current.compact ? current : fresh(current.key)));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, fontSizePx: fit.fontSizePx, compact: fit.compact };
}
