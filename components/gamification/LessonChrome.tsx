import type { ChapterReadingLayout } from "@/lib/useChapterReadingLayout";
import { LessonTopBar } from "@/components/gamification/LessonTopBar";
import { ChapterFitProbes } from "@/components/gamification/ChapterFitProbes";

interface LessonChromeProps {
  label: string;
  version: string;
  current: number;
  total: number;
  onExit?: () => void;
  layout: ChapterReadingLayout;
}

// LessonTopBar plus the two pieces of plumbing lib/useChapterReadingLayout.ts needs from
// whoever's actually rendering the page — its own `bodyTopRef` top-of-card marker (see
// DayPathDiagram.tsx's identical use right after ITS OWN top bar/progress bar, which
// LessonTopBar is built to match exactly) and its hidden ChapterFitProbes.tsx set — pulled out
// of LearnSection.tsx purely to keep that file under this codebase's 200-line cap. Rendered
// once per lesson (not once per stage) so the SAME probe set/font-size search lives for the
// whole session, not remounted fresh on every stage change.
export function LessonChrome({ label, version, current, total, onExit, layout }: LessonChromeProps) {
  // Destructured into plain local bindings before the JSX below, rather than read inline as
  // `layout.xxx` — this codebase's react-hooks/refs lint rule flags EVERY prop expression on a
  // custom component (never a plain DOM element) built by reading a property straight off an
  // object whose own TYPE happens to include a ref field anywhere, regardless of which
  // property is actually being read; a local binding (the same shape ChapterReadingView.tsx's
  // own already-clean, directly-local `probeContainerRef` takes) reads as an ordinary value to
  // the same rule instead.
  const { bodyTopRef, probeContainerRef, pages, fillHeightPx, dayNumberByVerse, todaysVerseNumbers, completedDays, locationTags, iconTags, pegActive } =
    layout;
  return (
    <>
      <LessonTopBar label={label} version={version} current={current} total={total} onExit={onExit} />
      <div ref={bodyTopRef} />
      <div className="mx-auto w-full max-w-2xl px-4">
        <ChapterFitProbes
          ref={probeContainerRef}
          pages={pages}
          fillHeightPx={fillHeightPx}
          dayNumberByVerse={dayNumberByVerse}
          todaysVerseNumbers={todaysVerseNumbers}
          completedDays={completedDays}
          locationTags={locationTags}
          iconTags={iconTags}
          pegActive={pegActive}
        />
      </div>
    </>
  );
}
