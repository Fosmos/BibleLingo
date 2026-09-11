"use client";

import { useEffect, useRef, useState } from "react";

export interface ParchmentFillHeight {
  // Attach to a marker element sitting immediately above where the parchment card renders
  // (right after the top bar/progress bar) — its own top edge is where the card's available
  // space starts.
  bodyTopRef: React.RefObject<HTMLDivElement | null>;
  // Attach to (or wrap) PathBottomDock.tsx — its own rendered height is subtracted from the
  // available space, whatever that dock happens to contain on a given path.
  dockRef: React.RefObject<HTMLDivElement | null>;
  // The exact pixel height left for the parchment card once everything else around it is
  // accounted for — null until the first real measurement lands (see the doc comment below).
  fillHeightPx: number | null;
}

// BottomTabBar.tsx's own fixed nav — AuthGate.tsx's `<main>` reserves this via `pb-20` so the
// tab bar never overlaps page content; PathBottomDock.tsx's own `sticky bottom-20` clears the
// same 5rem for the same reason. The one number this hook still hardcodes rather than measures
// — everything else below is read straight off the real, rendered page.
const BOTTOM_TAB_BAR_PX = 80;
// ChapterReadingView.tsx's own outer wrapper padding (`py-3`, top + bottom) — the parchment
// card sits inside that wrapper, not flush with `bodyTopRef`'s own edge, so it needs
// subtracting out of the space between `bodyTopRef` and the dock too.
const READING_VIEW_PADDING_PX = 24;

// The Path reading screen is meant to fill the ENTIRE space between its own top bar/progress
// bar and PathBottomDock.tsx below it — see ParchmentCard.tsx's own `fill` mode — with no
// document scroll at all: everything above the card, the card itself, and everything below it
// should add up to exactly one viewport, every time. A single hardcoded "chrome is Npx tall"
// guess can't actually guarantee that: the top bar's own height, the dock's own height (it
// carries a different button row depending on the path), safe-area insets, browser zoom, and
// the surrounding app window's own real size all vary by device and by screen — and drift
// silently out of sync with any one guessed number. This hook measures the REAL rendered
// positions instead: `bodyTopRef`'s own top edge (already reflects however tall the top
// bar/progress bar actually rendered) and `dockRef`'s own real height (however tall THAT
// actually rendered), then solves for the exact height left over — so the card is correct by
// construction in any environment, not just the ones this was tested in.
//
// Re-measures on mount, on window resize, and via ResizeObserver on the two markers AND on
// `<body>` itself: a review/lesson screen wraps this card+dock in its own column with extra
// chrome above `bodyTopRef` (a review header, an entity picker), and when THAT chrome reflows
// — a web font swapping in, a label wrapping — `bodyTopRef` only MOVES, its own box never
// resizes, so watching the markers alone would miss it and leave the card a stale ~20px too
// tall (a scrollbar the reading view never has). Watching `<body>` catches every such reflow.
export function useParchmentFillHeight(): ParchmentFillHeight {
  const bodyTopRef = useRef<HTMLDivElement>(null);
  const dockRef = useRef<HTMLDivElement>(null);
  const [fillHeightPx, setFillHeightPx] = useState<number | null>(null);

  // No dependency array — deliberately re-runs after EVERY render, not just the first, and
  // re-attaches the ResizeObserver each time (harmless: observing an element it's already
  // watching is a no-op). Not every caller has both marker elements mounted from its very
  // first render the way DayPathDiagram.tsx (this hook's original, still-typical caller)
  // always does: the Learn flow's own dockRef (see LessonControlBar.tsx) is only attached by
  // whichever DRILL is currently showing, and the very first stage a lesson opens on doesn't
  // necessarily attach it at all (e.g. Listen — see KineticTextRep.tsx). A plain
  // `useEffect(..., [])` only ever runs once, on that very first render — if either ref was
  // still null right then, it would stay unobserved forever, silently leaving fillHeightPx
  // stuck at null (and so, downstream, pagination stuck at its own smallest-page fallback)
  // even once a later stage genuinely does attach a real element.
  useEffect(() => {
    function measure() {
      // A backgrounded Browser pane / not-yet-laid-out tab reports innerHeight 0 (every rect
      // collapses with it) — measuring then would zero the card; keep the last good value.
      if (window.innerHeight < 200) return;
      const bodyTopRect = bodyTopRef.current?.getBoundingClientRect().top;
      const dockHeight = dockRef.current?.getBoundingClientRect().height;
      if (bodyTopRect === undefined || dockHeight === undefined) return;
      // `+ scrollY` makes this the distance from the top of the DOCUMENT, not the viewport —
      // identical in the settled (unscrolled) state this is solving for, but immune to a
      // transient scroll mid-reflow, so re-measuring while the page is briefly scrolled can't
      // feed a too-small offset back in and grow the card into a runaway.
      const bodyTop = bodyTopRect + window.scrollY;
      const available = window.innerHeight - BOTTOM_TAB_BAR_PX - bodyTop - dockHeight - READING_VIEW_PADDING_PX;
      setFillHeightPx(Math.max(available, 0));
    }

    measure();
    window.addEventListener("resize", measure);
    const observer = new ResizeObserver(measure);
    if (bodyTopRef.current) observer.observe(bodyTopRef.current);
    if (dockRef.current) observer.observe(dockRef.current);
    if (typeof document !== "undefined" && document.body) observer.observe(document.body);
    return () => {
      window.removeEventListener("resize", measure);
      observer.disconnect();
    };
  });

  return { bodyTopRef, dockRef, fillHeightPx };
}
