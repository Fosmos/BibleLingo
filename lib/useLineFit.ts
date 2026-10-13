"use client";

import { useCallback, useLayoutEffect, useRef, useState, type RefObject } from "react";

let canvas: HTMLCanvasElement | null = null;

// An element's text width (re-measured on resize) and a way to measure a string at its own font,
// with a shared canvas — for fitting lines to it. Width is 0 until measured.
export function useLineFit<T extends HTMLElement>(): [RefObject<T | null>, (text: string) => number, number] {
  const ref = useRef<T>(null);
  const [box, setBox] = useState<{ width: number; font: string }>({ width: 0, font: "" });

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const measure = () => {
      const style = getComputedStyle(element);
      const width = element.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
      const font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      setBox((prev) => (prev.width === width && prev.font === font ? prev : { width, font }));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    document.fonts?.ready.then(measure);
    return () => observer.disconnect();
  }, []);

  const measure = useCallback(
    (text: string) => {
      if (typeof document === "undefined") return 0;
      canvas ??= document.createElement("canvas");
      const context = canvas.getContext("2d");
      if (!context) return 0;
      context.font = box.font;
      return context.measureText(text).width;
    },
    [box.font],
  );
  return [ref, measure, box.width];
}
