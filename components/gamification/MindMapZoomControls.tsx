"use client";

import Link from "next/link";
import { LocateFixed, Shuffle } from "lucide-react";

interface MindMapZoomControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  // Back to the reader's place on their path (see lib/useMindMapLocate.ts) — none shown without one.
  onLocate?: () => void;
  // True while a pericope's own verse-stream is zoom-locked (see
  // lib/useMindMapPericopeZoomLock.ts) — manual zoom would fight that fixed framing, so only the
  // "Switch path" link stays up during the lock.
  hideZoomButtons?: boolean;
}

const ZOOM_BUTTON_CLASS = "flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm font-bold text-ink shadow-sm dark:bg-zinc-900 dark:text-zinc-100";

// The pan/zoom canvas's own +/-/Reset controls, plus a way back to the path picker (see
// app/begin/page.tsx's own GuidedPathFlow) — split out of BookMindMap.tsx purely to keep that
// file under this codebase's own 200-line file cap (see CLAUDE.md), no behavior difference from
// having it inline there.
export function MindMapZoomControls({ onZoomIn, onZoomOut, onReset, onLocate, hideZoomButtons }: MindMapZoomControlsProps) {
  return (
    <div className="absolute right-3 top-3 z-20 flex items-center gap-1.5">
      {/* Distinct from BookMindMap.tsx's own "Start learning {book}" button (top-left,
          browsing-only) — this one is always here, and reopens the FULL path picker rather
          than switching straight to whichever book happens to be currently browsed. */}
      <Link href="/begin" aria-label="Switch path" className={ZOOM_BUTTON_CLASS}>
        <Shuffle size={14} />
      </Link>
      {onLocate && (
        <button type="button" onClick={onLocate} aria-label="Back to my place" title="Back to my place" className={ZOOM_BUTTON_CLASS}>
          <LocateFixed size={15} />
        </button>
      )}
      {!hideZoomButtons && (
        <>
          <button type="button" onClick={onZoomIn} aria-label="Zoom in" className={ZOOM_BUTTON_CLASS}>
            +
          </button>
          <button type="button" onClick={onZoomOut} aria-label="Zoom out" className={ZOOM_BUTTON_CLASS}>
            −
          </button>
          <button type="button" onClick={onReset} className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-ink shadow-sm dark:bg-zinc-900 dark:text-zinc-100">
            Reset
          </button>
        </>
      )}
    </div>
  );
}
