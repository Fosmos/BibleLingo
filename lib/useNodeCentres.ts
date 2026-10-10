"use client";

import { useLayoutEffect, useRef, useState, type RefObject } from "react";

export type NodeCentre = [number, number];

// The Chapter Path View's verse nodes, measured from the DOM (sense-line rows vary in height):
// each `[data-path-node]` centre relative to the wrapper, divided by any ancestor scale so it
// holds mid-transition. Re-measures on resize and once fonts load; state only changes when a
// value actually does, so it never loops.
export function useNodeCentres<T extends HTMLElement>(deps: unknown): [RefObject<T | null>, NodeCentre[]] {
  const wrapperRef = useRef<T>(null);
  const [centres, setCentres] = useState<NodeCentre[]>([]);

  useLayoutEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    let cancelled = false;
    const measure = () => {
      if (cancelled) return;
      const box = wrapper.getBoundingClientRect();
      const scale = wrapper.offsetWidth ? box.width / wrapper.offsetWidth : 1;
      if (!scale) return;
      const next = Array.from(wrapper.querySelectorAll<HTMLElement>("[data-path-node]")).map((node): NodeCentre => {
        const rect = node.getBoundingClientRect();
        return [Math.round((rect.left + rect.width / 2 - box.left) / scale), Math.round((rect.top + rect.height / 2 - box.top) / scale)];
      });
      setCentres((prev) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(wrapper);
    document.fonts?.ready.then(measure);
    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [deps]);

  return [wrapperRef, centres];
}
