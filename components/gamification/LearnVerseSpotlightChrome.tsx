"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import type { MemorizationDay, VerseSegment } from "@/types";
import type { ChapterReadingLayout } from "@/lib/useChapterReadingLayout";
import { usePericopeHeading } from "@/lib/usePericopeHeading";
import { useLessonSessionStore } from "@/store/useLessonSessionStore";
import { ChapterFitProbes } from "@/components/gamification/ChapterFitProbes";
import { LearnMindMapSpotlight } from "@/components/gamification/LearnMindMapSpotlight";

interface LearnVerseSpotlightChromeProps {
  verse: VerseSegment;
  allDays: MemorizationDay[];
  day: MemorizationDay;
  completedDays: number;
  todaysDay: number;
  onExit?: () => void;
  layout: ChapterReadingLayout;
  // Set only when this Learn session is running inside PathOverviewScreen.tsx's own in-place
  // Mind Map bottom sheet (see InPlaceLessonSession.tsx's own doc comment) — the REAL canvas
  // already shows behind/above the sheet, zoomed to this same verse (see
  // lib/useMindMapVerseFocusLock.ts), and MindMapSheetBreadcrumb.tsx already renders the one
  // breadcrumb/back-button chrome this whole experience needs, fixed at the true top of the
  // page — so this component skips its own breadcrumb row AND its own small
  // `LearnMindMapSpotlight` copy entirely (both redundant here) and renders nothing but the
  // measurement marker below, reporting the live verse up via store/useLessonSessionStore.ts's
  // `focusVerse` as it changes so that page-top bar and the real canvas stay in sync. Undefined/
  // false (the standalone `/day/[dayNumber]` route, with no real canvas or page-top bar around
  // it) keeps showing its own breadcrumb + `LearnMindMapSpotlight` exactly as before.
  embeddedInMindMap?: boolean;
}

// Replaces LessonChrome/LessonTopBar for the five per-verse drilling phases (Rhythm, Draw First
// Letters, Speak Hint, Type by First Letter, Speak Verse — see LearnSection.tsx's own
// `spotlightPhases`) — a thin breadcrumb trail to the verse actually being drilled, then the
// compact Mind Map spotlight (LearnMindMapSpotlight.tsx) zoomed in on it. Every other Learn phase
// (Orientation/Pray/whole-day cumulative typing) keeps the plain LessonChrome unchanged.
//
// Same `bodyTopRef`/`ChapterFitProbes` plumbing LessonChrome.tsx already renders, copied
// verbatim — lib/useParchmentFillHeight.ts measures whatever real chrome sits above the
// parchment to solve for its own available height, regardless of which chrome that is, so
// swapping LessonTopBar for this component needs no change on that end.
export function LearnVerseSpotlightChrome({ verse, allDays, day, completedDays, todaysDay, onExit, layout, embeddedInMindMap }: LearnVerseSpotlightChromeProps) {
  const router = useRouter();
  const heading = usePericopeHeading(verse.book, verse.chapter, verse.verseNumber);
  const { bodyTopRef, probeContainerRef, pages, fillHeightPx, dayNumberByVerse, todaysVerseNumbers, completedDays: layoutCompletedDays, locationTags, iconTags, pegActive } =
    layout;
  const setFocusVerse = useLessonSessionStore((state) => state.setFocusVerse);
  // Never cleared on unmount — a whole-day stage (Orientation, cumulative typing, Pray) swaps
  // this component out mid-lesson, and clearing then would drop the sheet's breadcrumb (and its
  // Back button) and zoom the canvas back out. BookMindMapWithLessonSheet.tsx's own closeSheet
  // is the one place focus clears, when the sheet itself actually closes.
  useEffect(() => {
    if (!embeddedInMindMap) return;
    setFocusVerse({ book: verse.book, chapter: verse.chapter, verseNumber: verse.verseNumber });
  }, [embeddedInMindMap, verse.book, verse.chapter, verse.verseNumber, setFocusVerse]);

  return (
    <>
      {!embeddedInMindMap && (
        <div className="mx-auto w-full max-w-2xl px-4 pt-4">
          <div className="mb-2 flex items-center gap-2">
            <button
              type="button"
              onClick={onExit ?? (() => router.back())}
              className="flex shrink-0 items-center gap-1 text-sm font-medium text-ink-muted hover:text-brand-600"
            >
              <ChevronLeft size={16} /> Back
            </button>
            <p className="flex-1 truncate text-center text-xs font-medium uppercase tracking-wide text-ink-muted dark:text-zinc-500">
              {verse.book} {verse.chapter}
              {heading && <span> › {heading}</span>}
              <span> › v{verse.verseNumber}</span>
            </p>
            <span className="shrink-0" aria-hidden="true" style={{ width: 16 }} />
          </div>
          <LearnMindMapSpotlight
            book={verse.book}
            chapter={verse.chapter}
            verseNumber={verse.verseNumber}
            allDays={allDays}
            day={day}
            completedDays={completedDays}
            todaysDay={todaysDay}
          />
        </div>
      )}
      <div ref={bodyTopRef} />
      <div className="mx-auto w-full max-w-2xl px-4">
        <ChapterFitProbes
          ref={probeContainerRef}
          pages={pages}
          fillHeightPx={fillHeightPx}
          dayNumberByVerse={dayNumberByVerse}
          todaysVerseNumbers={todaysVerseNumbers}
          completedDays={layoutCompletedDays}
          locationTags={locationTags}
          iconTags={iconTags}
          pegActive={pegActive}
        />
      </div>
    </>
  );
}
