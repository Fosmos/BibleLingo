"use client";

import { useEffect, useState } from "react";

// An element's own live content width — 0 until it's first measured on the client, so anything
// derived from it (SenseLineVerse.tsx's clause merging) renders its plain server-side shape
// first and only adjusts once real layout exists, never mismatching hydration. Returns a
// callback ref (not a ref object) so an element that mounts later — inside a portal that only
// renders once its target exists — still gets measured the moment it attaches.
export function useElementWidth<T extends HTMLElement>(): [(node: T | null) => void, number] {
  const [element, setElement] = useState<T | null>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (!element) return;
    const measure = () => setWidth(element.clientWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [element]);

  return [setElement, width];
}
