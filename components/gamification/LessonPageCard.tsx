"use client";

import { useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { VerseSegment } from "@/types";
import type { ChapterReadingLayout } from "@/lib/useChapterReadingLayout";
import type { PericopeSegment } from "@/lib/pathZones";
import { pageIndexForVerse } from "@/lib/chapterPagination";
import { ChapterPageContent } from "@/components/gamification/ChapterPageContent";
import { ParchmentCard } from "@/components/ui/ParchmentCard";

interface LessonPageCardProps {
  layout: ChapterReadingLayout;
  // The verse to look up the real page FROM — for a single-verse stage this is the one verse
  // actually being drilled; for a multi-verse stage (see `isActive` below) it's whichever verse
  // should decide which page opens (e.g. ReviewChain.tsx's own "furthest along" verse).
  activeVerse: VerseSegment;
  // Which verse(s) on the page actually get `renderActiveVerse` — every other verse on the
  // same real reading-view page around them renders completely normally (see
  // ChapterPageContent.tsx). Defaults to matching `activeVerse` alone; pass this for a stage
  // that drills several verses on the same page at once (ReviewChain.tsx's own combine stage).
  isActive?: (verse: VerseSegment) => boolean;
  // What to show in an active verse's own place — the full verse, first letters only, or fully
  // blanked, depending on the stage (see ChapterVerseRun.tsx's own doc comment on
  // renderVerseWords). Each verse's own number/gold underline/pericope heading around it always
  // render the same regardless.
  renderActiveVerse: (verse: VerseSegment) => ReactNode;
  // SRS review only (see FirstLetterMultiVersePageCard.tsx) — an entity can span several real
  // pages, unlike a single Learn day's own verses (always sized to fit one). Set to let the
  // reader manually flip between them (same ChevronLeft/ChevronRight arrows
  // ChapterReadingView.tsx uses), rather than being locked to whichever page `activeVerse`
  // currently sits on. A manual flip always snaps back the moment `activeVerse` itself moves to
  // a DIFFERENT page (recall progressing forward) — it's a peek, not a way to get lost from
  // wherever recall actually is.
  allowManualFlip?: boolean;
  // SRS review only — see ChapterPageContent.tsx's own doc comment. A mid-page pericope
  // heading stays hidden until this returns true for its own segment.
  isHeadingVisible?: (segment: PericopeSegment) => boolean;
  // Blind-recall drills only — see ChapterVerseRun.tsx. A verse's number stays hidden until
  // this returns true (the word before it has been recalled).
  isVerseNumberVisible?: (verse: VerseSegment) => boolean;
}

// The Learn/Review "verse lives here" surface — the SAME real reading-view page (every verse
// that page actually holds, in full, at the exact coordinates it sits at while just browsing
// — see ChapterPageContent.tsx) at the SAME size, position, and uniform font size as the Path
// screen's own reading view (see lib/useChapterReadingLayout.ts, the shared hook `layout`
// comes from), with only the one verse actually being drilled swapped for whatever this stage
// wants shown in its place. Replaces the old LessonParchmentCard/LessonVerseContext pairing,
// which rendered a stage's own smaller "prev/today/next" window at the stage's own fixed text
// size instead of the real page a reader would already know from browsing. Doesn't render its
// own ChapterFitProbes.tsx — that's owned once by the caller (LearnSection.tsx), alongside
// `layout` itself, since re-mounting a fresh probe set on every single stage change (this
// component itself remounts each stage, via its own drill's `key={stageKey}`) would be pure
// waste: the SAME probeContainerRef/fontSizePx already live for the whole lesson, not just
// one stage.
export function LessonPageCard({
  layout,
  activeVerse,
  isActive,
  renderActiveVerse,
  allowManualFlip,
  isHeadingVisible,
  isVerseNumberVisible,
}: LessonPageCardProps) {
  const autoPageIndex = pageIndexForVerse(layout.pages, activeVerse.verseNumber);
  const [manualPageIndex, setManualPageIndex] = useState<number | null>(null);
  const [lastAutoPageIndex, setLastAutoPageIndex] = useState(autoPageIndex);
  // Adjusting state during render (not an effect) when a prop-derived value changes — this
  // codebase's own established pattern (see lib/useChapterPagination.ts's identical anchorKey
  // use) — snaps a manual flip back the instant recall itself actually moves to a new page.
  if (autoPageIndex !== lastAutoPageIndex) {
    setLastAutoPageIndex(autoPageIndex);
    setManualPageIndex(null);
  }
  const pageIndex = manualPageIndex ?? autoPageIndex;
  const page = layout.pages[pageIndex];
  const matches = isActive ?? ((verse: VerseSegment) => verse.id === activeVerse.id);

  function renderVerseWords(verse: VerseSegment) {
    return matches(verse) ? renderActiveVerse(verse) : undefined;
  }

  return (
    <ParchmentCard fill fillHeightPx={layout.fillHeightPx}>
      {allowManualFlip && pageIndex < layout.pages.length - 1 && (
        <button
          type="button"
          onClick={() => setManualPageIndex(pageIndex + 1)}
          aria-label="Next page"
          className="absolute right-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-ink-soft shadow-sm transition-colors hover:bg-white hover:text-brand-600 dark:bg-zinc-800/85 dark:text-zinc-300 dark:hover:bg-zinc-700"
        >
          <ChevronRight size={18} />
        </button>
      )}
      {allowManualFlip && pageIndex > 0 && (
        <button
          type="button"
          onClick={() => setManualPageIndex(pageIndex - 1)}
          aria-label="Previous page"
          className="absolute left-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-ink-soft shadow-sm transition-colors hover:bg-white hover:text-brand-600 dark:bg-zinc-800/85 dark:text-zinc-300 dark:hover:bg-zinc-700"
        >
          <ChevronLeft size={18} />
        </button>
      )}
      <ChapterPageContent
        page={page}
        dayNumberByVerse={layout.dayNumberByVerse}
        todaysVerseNumbers={layout.todaysVerseNumbers}
        completedDays={layout.completedDays}
        locationTags={layout.locationTags}
        iconTags={layout.iconTags}
        pegActive={layout.pegActive}
        fontSizePx={layout.fontSizePx}
        renderVerseWords={renderVerseWords}
        isHeadingVisible={isHeadingVisible}
        isVerseNumberVisible={isVerseNumberVisible}
        onSelect={() => {}}
      />
    </ParchmentCard>
  );
}
