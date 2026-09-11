import type { ReactNode } from "react";

interface ParchmentCardProps {
  children: ReactNode;
  // The Path screen's own reading view (ChapterReadingView.tsx) sits on a single, non-
  // scrolling screen — it measures its OWN real available height at runtime (see
  // useParchmentFillHeight.ts) and can ask this card to fill exactly that, down to just above
  // its sticky bottom dock. Every Learn/SRS drill stage (LessonParchmentCard.tsx) renders in
  // normal scrolling document flow, below a top bar and above a per-stage control bar whose
  // own height varies stage to stage (a text input vs. a drawing canvas vs. a prayer timer) —
  // there's no single "rest of the viewport" to measure there, so those stay on the default,
  // content-driven sizing below instead.
  fill?: boolean;
  // The real measured pixel height to fill — see useParchmentFillHeight.ts. Only meaningful
  // when `fill` is true; null/undefined before the first measurement lands (the very first
  // frame, pre-mount) or when `fill` is false.
  fillHeightPx?: number | null;
}

// The ONE parchment sheet shell — corner radius, shadow, background, and inner padding —
// shared by every screen that shows verse text on parchment. Two height modes:
// - Default: the sheet's own height FOLLOWS its content — it grows to sit right against the
//   last line rendered inside it (a `min-h` floor is purely cosmetic, so a near-empty stage
//   doesn't collapse into a sliver; content taller than it simply grows the box past it).
// - `fill`: the sheet takes up `fillHeightPx` — the reading view's own REAL measured remaining
//   space between its top chrome and its sticky bottom dock (see useParchmentFillHeight.ts),
//   not a guessed constant — so the sheet reaches exactly down to just above that dock, on any
//   device, at any zoom, in any window size, with the whole screen never needing to scroll.
//   Before that measurement lands (the very first frame) this falls back to a fixed, modest
//   default height rather than rendering with no height at all. `overflow-hidden` moves onto
//   the inner content wrapper too in this mode (a safety net — pagination is a word-count
//   heuristic, not a real measurement of the TEXT itself, so an occasional page that runs
//   slightly over budget clips instead of overflowing past the measured box); the OUTER wrapper
//   keeps it either way, so a square-cornered child (a canvas, an image) still clips to this
//   card's own rounded corners regardless of mode.
const FILL_FALLBACK_HEIGHT_PX = 420;

// The inner content div's own padding — exported so a caller that needs to reproduce this
// SAME box outside a real ParchmentCard (ChapterReadingView.tsx's own hidden multi-page
// measurement probes — see lib/useUniformFitText.ts) applies the exact same padding rather
// than a hand-copied, driftable duplicate of this string.
export const PARCHMENT_INNER_PADDING_CLASSES = "px-6 pb-8 pt-5 sm:px-12 sm:pb-10 sm:pt-6";

// `fill` mode's own real-vs-fallback height resolution — exported so a caller building
// something OUTSIDE a real ParchmentCard (again, ChapterReadingView.tsx's hidden probes) can
// target the exact same height this component itself would.
export function resolveFillHeightPx(fillHeightPx: number | null | undefined): number {
  return fillHeightPx && fillHeightPx > 0 ? fillHeightPx : FILL_FALLBACK_HEIGHT_PX;
}

export function ParchmentCard({ children, fill = false, fillHeightPx }: ParchmentCardProps) {
  const resolvedFillHeightPx = resolveFillHeightPx(fillHeightPx);
  return (
    <div
      className={`relative flex flex-col overflow-hidden rounded-3xl bg-parchment shadow-md shadow-brand-900/5 dark:bg-zinc-900 ${
        fill ? "" : "min-h-[220px]"
      }`}
      style={fill ? { height: `${resolvedFillHeightPx}px` } : undefined}
    >
      <div className={`flex flex-col ${PARCHMENT_INNER_PADDING_CLASSES} ${fill ? "flex-1 overflow-hidden" : ""}`}>{children}</div>
    </div>
  );
}
