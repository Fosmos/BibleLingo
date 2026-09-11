"use client";

import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { ChevronDown } from "lucide-react";

interface LessonControlBarProps {
  children: ReactNode;
  // Attaches to lib/useParchmentFillHeight.ts's own `dockRef` — set only by the Learn flow's
  // new real-page parchment (LessonPageCard.tsx), which needs this bar's own real rendered
  // height to solve for the exact space left for the card above it, the same way
  // PathBottomDock.tsx already does for the Path screen's own reading view. Undefined for
  // every stage still on the old, content-driven parchment sizing.
  dockRef?: RefObject<HTMLDivElement | null>;
}

// The shared "act here" surface below a LessonParchmentCard/LessonPageCard — every stage's own
// buttons, text input, or mic button render here instead of wherever they happened to fall
// inside a long single column, so a stage always reads as "verse up top, do the thing down
// here," matching the Path screen's own parchment-card-then-bottom-dock shape (see
// DayPathDiagram.tsx/PathBottomDock.tsx) — including PathBottomDock's own sticky position and
// real measured footprint (101px — see its own three rows: the icon nav, "Today's Lesson"
// label, and Start Lesson button), capped with `max-h`/`overflow-y-auto` rather than left to
// grow: a stage whose own controls are naturally taller (Understand's clause cards + role
// palette, Draw First Letter's drawing canvas) scrolls inside this same box instead of pushing
// the card above it taller than lib/useChapterReadingLayout.ts's own
// fillHeightPx/pages/fontSizePx were computed against — this box's real rendered height still
// feeds directly into that same computation (see lib/useParchmentFillHeight.ts's own dockRef,
// now attached to the OUTER wrapper below rather than the scrolling box itself, but the two
// stay the same real height either way), so drifting from PathBottomDock's real footprint here
// would make the Learn flow's own parchment quietly stop matching the reading view's, even
// though both are still asking the identical shared hook for "the same layout."
export function LessonControlBar({ children, dockRef }: LessonControlBarProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  // Whether this box's own content currently overflows its max-h cap, with more still below
  // the fold — a box this small giving no hint there's anything to scroll to at all left a
  // stage with real controls down there (Understand's role palette + Continue button chief
  // among them) looking finished when it wasn't; a first-time reader had no reason to think to
  // scroll a box this size. Tracked live off the scroll box's own real metrics — content
  // height, viewport height, and current scroll position — so the hint disappears the moment
  // there's genuinely nothing further to reveal, not just once on mount.
  const [hasMoreBelow, setHasMoreBelow] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!dockRef || !el) return;
    function checkOverflow() {
      if (!el) return;
      setHasMoreBelow(el.scrollHeight - el.clientHeight - el.scrollTop > 4);
    }
    checkOverflow();
    const observer = new ResizeObserver(checkOverflow);
    observer.observe(el);
    el.addEventListener("scroll", checkOverflow);
    return () => {
      observer.disconnect();
      el.removeEventListener("scroll", checkOverflow);
    };
  });

  if (!dockRef) {
    return <div className="flex flex-col items-center gap-3 px-2">{children}</div>;
  }

  return (
    <div ref={dockRef} className="sticky bottom-20 z-20 border-t border-line bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div ref={scrollRef} className="flex max-h-[101px] flex-col items-center gap-1 overflow-y-auto px-4 py-1.5">
        {children}
      </div>
      {hasMoreBelow && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex h-5 items-end justify-center bg-gradient-to-t from-white to-transparent dark:from-zinc-950">
          <ChevronDown size={14} className="mb-0.5 animate-bounce text-ink-muted dark:text-zinc-500" />
        </div>
      )}
    </div>
  );
}
