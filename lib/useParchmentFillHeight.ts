"use client";

import { useEffect, useRef, useState } from "react";

export interface ParchmentFillHeight {
  // Attach to a marker element sitting immediately above where the parchment card renders
  // (right after the top bar/progress bar) — its own top edge is where the card's available
  // space starts.
  bodyTopRef: React.RefObject<HTMLDivElement | null>;
  // Attach to (or wrap) PathBottomDock.tsx / LessonControlBar.tsx — its own rendered height is
  // subtracted from the available space, whatever that dock happens to contain right now. Both
  // are plain content-sized boxes (neither one is asked to stretch to fill anything — see
  // LessonControlBar.tsx's own doc comment on why it used to and no longer does), so `dockRef`
  // means the exact same thing to both callers of this hook.
  dockRef: React.RefObject<HTMLDivElement | null>;
  // The exact pixel height used as this chapter's own PAGINATION BUDGET (see
  // lib/pageBudget.ts) — no longer a real box any parchment card is asked to visually fill
  // (see ParchmentCard.tsx — no more `fill` mode anywhere), so its only remaining job is
  // feeding lib/chapterPagination.ts's own "how many lines fit on a page" math. Computed via
  // the exact SAME formula regardless of caller (see the doc comment below) — this is what
  // guarantees the Path screen's own reading view and every Learn/SRS drill stage split the
  // SAME chapter into the SAME pages, at the SAME font size, every time. Null until the first
  // real measurement lands.
  fillHeightPx: number | null;
}

// BottomTabBar.tsx's own fixed nav — AuthGate.tsx's `<main>` reserves this via `pb-20` so the
// tab bar never overlaps page content; PathBottomDock.tsx's own `sticky bottom-20` clears the
// same 5rem for the same reason. The one number this hook still hardcodes rather than measures
// — everything else below is read straight off the real, rendered page. Reserved UNCONDITIONALLY
// now, even on a lesson screen that hides the tab bar entirely (see AuthGate.tsx's own
// lessonSessionActive check) — `fillHeightPx` is a shared pagination budget, not a real "fill
// down to MY OWN screen's own tab bar" measurement anymore (see its own doc comment above), so
// it can't be allowed to vary just because one particular screen happens to have a little extra
// real estate a sibling screen doesn't; that gap alone would already be enough to paginate the
// SAME chapter differently between the two.
const BOTTOM_TAB_BAR_PX = 80;
// ChapterReadingView.tsx's own outer wrapper padding (`py-3`, top + bottom) — the parchment
// card sits inside that wrapper, not flush with `bodyTopRef`'s own edge, so it needs
// subtracting out of the space between `bodyTopRef` and the dock too.
const READING_VIEW_PADDING_PX = 24;
// PericopeTitle + both GhostContextLine rows all render OUTSIDE the card (see
// ChapterReadingView.tsx/LessonPageCard.tsx — both use the exact same three shared
// components), between bodyTopRef's marker and dockRef's own box, so none of their real height
// is captured by either measurement on their own. Measured real height is 64px (20 + 20 + 24, a
// single line apiece, and both ghost lines are `truncate` so can never wrap) — a small margin on
// top covers font-metric variance across devices, plus (a Learn stage's own extra wrapper gaps
// the Path screen's own doesn't have — see e.g. RhythmRep.tsx's `gap-3` between card and
// LessonControlBar, or a stage caption above the card) without reopening the large stop-short
// gap a much bigger margin would mean. This SAME constant now applies to every caller of this
// hook, not just the plain reading view — see fillHeightPx's own doc comment on why that's the
// whole point.
const READING_VIEW_CHROME_PX = 96;

// The Path reading screen is meant to fill the space between its own top bar/progress bar and
// PathBottomDock.tsx below it (see ParchmentCard.tsx's own `fill` mode) — this adds up to
// exactly one viewport every time, with no document scroll at all. A single hardcoded "chrome is
// Npx tall" guess can't actually guarantee that: the top bar's own height, the dock's own height (it
// carries a different button row depending on the path), safe-area insets, browser zoom, and
// the surrounding app window's own real size all vary by device and by screen — and drift
// silently out of sync with any one guessed number. This hook measures the REAL rendered
// positions instead: `bodyTopRef`'s own top edge (already reflects however tall the top
// bar/progress bar actually rendered) and `dockRef`'s own real height (however tall THAT
// actually rendered), then solves for the exact height left over — so the card is correct by
// construction in any environment, not just the ones this was tested in.
//
// Re-measures on mount and via ResizeObserver on the two markers AND on `<body>` itself, but
// ONLY UNTIL THE FIRST REAL MEASUREMENT SETTLES (see `settledRef` below) — after that, further
// dock/body reflows are ignored until an actual `window resize` forces a fresh settle. A
// review/lesson screen wraps this card+dock in its own column with extra chrome above
// `bodyTopRef` (a review header, an entity picker), and when THAT chrome reflows — a web font
// swapping in, a label wrapping — `bodyTopRef` only MOVES, its own box never resizes, so
// watching the markers alone would miss it; watching `<body>` catches every such reflow. That
// same broad watch is exactly why settling matters: a Learn lesson mounts a FRESH
// LessonControlBar.tsx for every single stage (see stageKey), and each drill's own controls are
// genuinely a different real height — a mic button vs. a word-tile tray vs. a bare letter input.
// Without freezing, `fillHeightPx` would silently drift stage to stage as each one's dock
// resizes, and since it's this chapter's own PAGINATION BUDGET, that drift changed how many
// verses landed on a page depending on which drill happened to be mounted at the moment it last
// measured — the SAME bug this hook's whole design already exists to prevent (see fillHeightPx's
// own doc comment), just reintroduced one level down. Freezing after the first settle is what
// makes "the parchment never resizes as the stage changes, only the active page/verse does"
// (see LearnSection.tsx's own doc comment) actually true.
//
// ONE formula, used identically by every caller (the Path screen's own reading view AND every
// Learn/SRS drill stage) — there used to be a second `splitDock` branch here specifically for
// the Learn flow, which computed `fillHeightPx` as an arbitrary 80% slice of the space below the
// top chrome (reserving the other 20% for LessonControlBar.tsx to stretch into) instead of this
// same real-dockHeight-based formula. That meant the SAME chapter could paginate into a
// DIFFERENT number of verses per page depending on whether it was open in the Path screen or
// mid-lesson — the one thing this hook's own original design was explicitly meant to prevent
// (see its own top doc comment). It also capped LessonControlBar to that same arbitrary 20% no
// matter how much real room the viewport actually had below it, forcing a scrollbar inside a
// stage's own controls even when there was genuine blank space further down the screen.
// LessonControlBar is a plain content-sized box now, exactly like PathBottomDock.tsx already
// was — so `dockRef` measures a REAL height in both cases, and this one formula is correct for
// both without needing to know which screen is asking.
export function useParchmentFillHeight(): ParchmentFillHeight {
  const bodyTopRef = useRef<HTMLDivElement>(null);
  const dockRef = useRef<HTMLDivElement>(null);
  const [fillHeightPx, setFillHeightPx] = useState<number | null>(null);
  // True once a real measurement has landed — see this hook's own top doc comment. Reset only
  // by a genuine window resize, never by a dock/body reflow alone.
  const settledRef = useRef(false);

  // No dependency array — deliberately re-runs after EVERY render, not just the first, and
  // re-attaches the ResizeObserver each time (harmless: observing an element it's already
  // watching is a no-op). Not every caller has both marker elements mounted from its very
  // first render the way DayPathDiagram.tsx (this hook's original, still-typical caller)
  // always does: the Learn flow's own dockRef (see LessonControlBar.tsx) is only attached by
  // whichever DRILL is currently showing, and the very first stage a lesson opens on doesn't
  // necessarily attach it at all (e.g. Listen — see ListenVerseRep.tsx). A plain
  // `useEffect(..., [])` only ever runs once, on that very first render — if either ref was
  // still null right then, it would stay unobserved forever, silently leaving fillHeightPx
  // stuck at null (and so, downstream, pagination stuck at its own smallest-page fallback)
  // even once a later stage genuinely does attach a real element. Re-attaching every render
  // costs nothing extra now that `measure` itself no-ops once settled.
  useEffect(() => {
    function measure(force: boolean) {
      if (!force && settledRef.current) return;
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
      const available = window.innerHeight - BOTTOM_TAB_BAR_PX - bodyTop - dockHeight - READING_VIEW_PADDING_PX - READING_VIEW_CHROME_PX;
      setFillHeightPx(Math.max(available, 0));
      settledRef.current = true;
    }
    function onResize() {
      settledRef.current = false;
      measure(true);
    }

    measure(false);
    window.addEventListener("resize", onResize);
    const observer = new ResizeObserver(() => measure(false));
    if (bodyTopRef.current) observer.observe(bodyTopRef.current);
    if (dockRef.current) observer.observe(dockRef.current);
    if (typeof document !== "undefined" && document.body) observer.observe(document.body);
    return () => {
      window.removeEventListener("resize", onResize);
      observer.disconnect();
    };
  });

  return { bodyTopRef, dockRef, fillHeightPx };
}
