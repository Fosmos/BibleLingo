import type { ReactNode, RefObject } from "react";

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
// grow: a stage whose own controls are naturally taller (Draw First Letter's drawing canvas)
// scrolls inside this same box instead of pushing the card above it taller than
// lib/useChapterReadingLayout.ts's own fillHeightPx/pages/fontSizePx were computed against —
// this box's real height feeds directly into that same computation (see
// lib/useParchmentFillHeight.ts's own dockRef), so drifting from PathBottomDock's real
// footprint here would make the Learn flow's own parchment quietly stop matching the reading
// view's, even though both are still asking the identical shared hook for "the same layout."
export function LessonControlBar({ children, dockRef }: LessonControlBarProps) {
  return (
    <div
      ref={dockRef}
      className={
        dockRef
          ? "sticky bottom-20 z-20 flex max-h-[101px] flex-col items-center gap-1 overflow-y-auto border-t border-line bg-white px-4 py-1.5 dark:border-zinc-800 dark:bg-zinc-950"
          : "flex flex-col items-center gap-3 px-2"
      }
    >
      {children}
    </div>
  );
}
