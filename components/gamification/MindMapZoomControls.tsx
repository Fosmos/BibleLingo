"use client";

interface MindMapZoomControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}

const ZOOM_BUTTON_CLASS = "flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm font-bold text-ink shadow-sm dark:bg-zinc-900 dark:text-zinc-100";

// The pan/zoom canvas's own +/-/Reset controls — split out of BookMindMap.tsx purely to keep
// that file under this codebase's own 200-line file cap (see CLAUDE.md), no behavior difference
// from having it inline there.
export function MindMapZoomControls({ onZoomIn, onZoomOut, onReset }: MindMapZoomControlsProps) {
  return (
    <div className="absolute right-3 top-3 z-20 flex items-center gap-1.5">
      <button type="button" onClick={onZoomIn} aria-label="Zoom in" className={ZOOM_BUTTON_CLASS}>
        +
      </button>
      <button type="button" onClick={onZoomOut} aria-label="Zoom out" className={ZOOM_BUTTON_CLASS}>
        −
      </button>
      <button type="button" onClick={onReset} className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-ink shadow-sm dark:bg-zinc-900 dark:text-zinc-100">
        Reset
      </button>
    </div>
  );
}
