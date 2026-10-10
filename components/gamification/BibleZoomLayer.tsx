"use client";

import type { CSSProperties, ReactNode } from "react";

interface BibleZoomLayerProps {
  depth: number;
  level: number;
  // Where this layer zooms from/into — the centre of whatever was tapped to reach it.
  origin: string | undefined;
  className?: string;
  children: ReactNode;
}

// One level of the Path tab's Bible browser, stacked over the others: the active level sits at
// full size; levels already passed blow up past the screen and fade, levels not reached yet
// shrink away — so tapping in zooms into the thing tapped.
export function BibleZoomLayer({ depth, level, origin, className, children }: BibleZoomLayerProps) {
  const state = depth === level ? "scale-100 opacity-100" : depth < level ? "pointer-events-none scale-[3] opacity-0" : "pointer-events-none scale-[.3] opacity-0";
  return (
    <div
      aria-hidden={depth === level ? undefined : true}
      style={{ "--zoom-origin": origin ?? "50% 40%" } as CSSProperties}
      className={`absolute inset-0 origin-[var(--zoom-origin)] transition-[transform,opacity] duration-[600ms,400ms] ease-[cubic-bezier(.4,0,.2,1)] ${state} ${className ?? ""}`}
    >
      {children}
    </div>
  );
}
