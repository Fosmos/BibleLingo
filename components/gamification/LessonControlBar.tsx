"use client";

import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { ChevronDown } from "lucide-react";
import { useLessonSessionStore } from "@/store/useLessonSessionStore";
import { VerseViewButtons } from "@/components/gamification/VerseViewButtons";

interface LessonControlBarProps {
  children: ReactNode;
  // Attaches to lib/useParchmentFillHeight.ts's own `dockRef` — set only by the Learn flow's
  // real-page parchment (LessonPageCard.tsx), which needs this bar's own real rendered height
  // to solve for the exact space left for the card above it, the same way PathBottomDock.tsx
  // already does for the Path screen's own reading view. Undefined for every stage still on the
  // old, content-driven parchment sizing.
  dockRef?: RefObject<HTMLDivElement | null>;
  // The verse(s) this stage drills, already joined into one string for a multi-verse stage —
  // when set, renders VerseViewButtons.tsx's own "View Verse"/"View Whole Verse" pair at the top
  // of this bar, so every stage carries the same neutral reference lookup regardless of whether
  // it happens to show the verse plainly or hides it for recall. Left unset only by a caller
  // with no single verse/text of its own to show (none currently — every real stage passes it).
  verseText?: string;
  verseMarkers?: Record<number, number>;
  // Rendered in the SAME row as the View First Letters/View Verse pair, to their right — see
  // VerseViewButtons.tsx's own `extra` prop this just forwards to. Left unset by every caller
  // with nothing of its own to put there.
  verseViewExtra?: ReactNode;
}

// The shared "act here" surface below a LessonParchmentCard/LessonPageCard — every stage's own
// buttons, text input, or mic button render here instead of wherever they happened to fall
// inside a long single column, so a stage always reads as "verse up top, do the thing down
// here," matching the Path screen's own parchment-card-then-bottom-dock shape (see
// DayPathDiagram.tsx/PathBottomDock.tsx). Plain CONTENT-sized now, exactly like
// PathBottomDock.tsx always was — it used to be force-sized to fill whatever leftover space
// lib/useParchmentFillHeight.ts's own `dockFillHeightPx` handed it (an arbitrary ~20% slice of
// the screen, reserved for it no matter how little its own content actually needed), which cut
// two ways: a stage with modest controls got a needlessly tall, near-empty box, while a stage
// with genuinely more content (Understand's clause cards + role palette, Draw First Letter's
// canvas) could get capped SMALLER than it needed and forced into an `overflow-y-auto` scroll
// even when the screen still had real, unused room further down. Sizing to content instead
// means this box is exactly as tall as it needs to be, no more, no less — `max-h-[70vh]` stays
// only as a backstop for the rare stage whose own controls are taller than that, which still
// scrolls inside this box rather than pushing off-screen with no way back. This box's real
// rendered height still feeds back into lib/useParchmentFillHeight.ts's own shared fillHeightPx
// computation (see that hook's own dockRef) — settling to a stable size within a couple of
// re-measures, not a one-shot calculation.
// Docks at the true screen bottom (not PathBottomDock's own `bottom-20`) because AuthGate.tsx
// hides the bottom tab bar for as long as this bar is mounted this way — see
// store/useLessonSessionStore.ts.
export function LessonControlBar({ children, dockRef, verseText, verseMarkers, verseViewExtra }: LessonControlBarProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  // Whether this box's own content currently overflows its max-h cap, with more still below
  // the fold — a box this small giving no hint there's anything to scroll to at all left a
  // stage with real controls down there (Understand's role palette + Continue button chief
  // among them) looking finished when it wasn't; a first-time reader had no reason to think to
  // scroll a box this size. Tracked live off the scroll box's own real metrics — content
  // height, viewport height, and current scroll position — so the hint disappears the moment
  // there's genuinely nothing further to reveal, not just once on mount.
  const [hasMoreBelow, setHasMoreBelow] = useState(false);
  const beginSession = useLessonSessionStore((state) => state.begin);
  const endSession = useLessonSessionStore((state) => state.end);

  // Docked mode is exactly "a lesson-like session is on screen" — tells AuthGate.tsx to hide
  // the bottom tab bar for as long as this bar itself is mounted this way (see
  // store/useLessonSessionStore.ts's own doc comment), so this bar's own `bottom-0` below
  // always docks against the real screen edge rather than the tab bar's now-absent space.
  useEffect(() => {
    if (!dockRef) return;
    beginSession();
    return endSession;
  }, [dockRef, beginSession, endSession]);

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

  const verseView = verseText && <VerseViewButtons text={verseText} verseMarkers={verseMarkers} extra={verseViewExtra} />;

  if (!dockRef) {
    return (
      <div className="flex flex-col items-center gap-3 px-2">
        {verseView}
        {children}
      </div>
    );
  }

  return (
    // sticky bottom-0 (not fixed) — `fixed` takes this bar completely OUT of document flow, so
    // nothing reserves its own real height any more and it silently overlaps whatever content
    // sits right above it (the parchment card's own bottom edge, a GhostContextLine) instead of
    // pushing past it. `sticky` keeps this bar's own box IN normal flow (so that space stays
    // genuinely reserved, never covered) while still docking visually to the screen's true
    // bottom edge. Full SCREEN width (not just this bar's own max-w-2xl reading-column parent)
    // comes from the classic CSS "full-bleed breakout" instead: `w-screen` + a negative left
    // margin of `50% of this bar's own centered position minus 50% of the viewport` cancels out
    // exactly however far the reading column's own centering had shifted it, without needing
    // `fixed`/`absolute` positioning at all — see OnScreenKeyboard.tsx's own doc comment on why
    // the keyboard needs true full width in the first place.
    <div ref={dockRef} className="sticky bottom-0 z-20 ml-[calc(50%-50vw)] w-screen border-t border-line bg-white dark:border-zinc-800 dark:bg-zinc-950">
      {/* No bottom padding (just top) — whatever renders last here, ideally the on-screen
          keyboard's own final row, sits flush against the screen's true bottom edge, the same
          way a native keyboard docks with no gap beneath it, rather than floating just above it. */}
      <div
        ref={scrollRef}
        className="flex max-h-[70vh] flex-col items-center justify-center gap-1 overflow-y-auto px-4 pt-1.5"
      >
        {verseView}
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
