import { useSyncExternalStore } from "react";

function subscribe(onChange: () => void): () => void {
  window.addEventListener("resize", onChange);
  window.addEventListener("orientationchange", onChange);
  return () => {
    window.removeEventListener("resize", onChange);
    window.removeEventListener("orientationchange", onChange);
  };
}

// window.innerHeight is the right value in principle, but isn't universally trustworthy —
// some embedding/automation contexts report it as 0. Falling through to the document's own
// rendered height, then the body's, means a real, non-zero measurement comes back from
// whichever source is actually populated in the current environment.
function getSnapshot(): number {
  return window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
}

function getServerSnapshot(): number {
  return 0;
}

// CSS `dvh` units resolve unreliably on some iPad/Safari builds once nested inside a
// few layers of flex containers — the declaration can silently fail there even though
// it renders correctly in Chromium, collapsing the element instead of giving it half
// the screen. Measuring the real viewport in JS works identically on every device.
// Returns 0 during SSR/before the first client measurement; callers should treat that
// as "not measured yet" and fall back to a CSS-only value.
export function useViewportHeight(): number {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
