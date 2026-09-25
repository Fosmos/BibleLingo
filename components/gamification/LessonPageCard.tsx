"use client";

import { useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { VerseSegment } from "@/types";
import type { ChapterReadingLayout } from "@/lib/useChapterReadingLayout";
import type { PericopeSegment } from "@/lib/pathZones";
import type { SenseLineWordRange } from "@/lib/senseLineWordRanges";
import { pageIndexForVerse } from "@/lib/chapterPagination";
import { computeGhostContext } from "@/lib/ghostContext";
import { buildEmbeddedChapterPage } from "@/lib/buildEmbeddedChapterPage";
import { useLessonSessionStore } from "@/store/useLessonSessionStore";
import { ChapterPageContent } from "@/components/gamification/ChapterPageContent";
import { PericopeTitle } from "@/components/gamification/PericopeTitle";
import { GhostContextLine } from "@/components/gamification/GhostContextLine";
import { ParchmentCard } from "@/components/ui/ParchmentCard";
import { SheetVerseZone } from "@/components/gamification/SheetVerseZone";

interface LessonPageCardProps {
  layout: ChapterReadingLayout;
  // The verse to look up the real page FROM — for a single-verse stage this is the one verse
  // actually being drilled; for a multi-verse stage (see `isActive` below) it's whichever verse
  // should decide which page opens (e.g. ReviewChain.tsx's own "furthest along" verse).
  activeVerse: VerseSegment;
  // Which verse(s) get `renderActiveVerse` — every other verse on the page renders normally.
  // Defaults to matching `activeVerse` alone; pass this for a stage that drills several verses
  // on the same page at once (ReviewChain.tsx's own combine stage).
  isActive?: (verse: VerseSegment) => boolean;
  // What to show in the active verse's own place, called ONCE PER CLAUSE (see
  // lib/senseLines.ts's own senseLineWordRanges) — the full verse, first letters only, or fully
  // blanked, depending on the stage, but always through the SAME multi-line clause structure
  // every other verse gets.
  renderActiveVerse: (verse: VerseSegment, range: SenseLineWordRange) => ReactNode;
  // SRS review only — an entity can span several real pages. Set to let the reader manually
  // flip between them, rather than being locked to whichever page `activeVerse` sits on — snaps
  // back the moment `activeVerse` moves to a DIFFERENT page (recall progressing forward).
  allowManualFlip?: boolean;
  // SRS review only — the page's own pericope title stays hidden until this returns true for
  // its own segment, so a blind recall test never leaks a section boundary early.
  isHeadingVisible?: (segment: PericopeSegment) => boolean;
  // Blind-recall drills only — a verse's number stays hidden until this returns true.
  isVerseNumberVisible?: (verse: VerseSegment) => boolean;
  // The word index the reader's actually on right now — only meaningful when `activeVerse` can
  // split across a page break and the caller reveals it progressively.
  activeWordIndex?: number;
  // SRS review only — hides the trailing ghost line, since it previews words BEYOND the
  // entity's own range. On (the default) everywhere else.
  showNextGhost?: boolean;
  // The in-place Mind Map lesson sheet's own card renders NO pagination — this stage's own
  // real verses directly, not a chapter-wide "page" a tiny 40dvh box has no business chunking.
  // Defaults to `[activeVerse]`; LessonWholeDayPageCard.tsx passes its own list through.
  embeddedVerses?: VerseSegment[];
}

// The Learn/Review "verse lives here" surface — the SAME real reading-view page (every verse
// that page actually holds, in full, at the exact coordinates it sits at while just browsing —
// see ChapterPageContent.tsx) at the SAME size/position/font as the Path screen's own reading
// view (lib/useChapterReadingLayout.ts), with only the one verse actually being drilled swapped
// for whatever this stage wants shown in its place. Doesn't render its own ChapterFitProbes.tsx
// — that's owned once by the caller (LearnSection.tsx), alongside `layout` itself.
//
// The pericope title and ghost-context lines around the card (PericopeTitle.tsx/
// GhostContextLine.tsx) are the exact same shared components ChapterReadingView.tsx renders, so
// a reader sees no difference between browsing and drilling mid-lesson. The card itself is the
// plain, content-sized ParchmentCard too (no `fill`) — that's the STANDALONE route's shape; see
// the portal branch below for the very different in-place Mind Map sheet shape.
export function LessonPageCard({
  layout,
  activeVerse,
  isActive,
  renderActiveVerse,
  allowManualFlip,
  isHeadingVisible,
  isVerseNumberVisible,
  activeWordIndex,
  showNextGhost = true,
  embeddedVerses,
}: LessonPageCardProps) {
  // Set only while the in-place Mind Map lesson sheet is open (lib/useMindMapSenseCardSlot.ts)
  // — a real DOM node this portals its card into instead of rendering inline, plus that same
  // slot's measured height (also feeds useChapterReadingLayout.ts's `fixedFillHeightPx`
  // override, so pagination and this card's visual height agree). Null on the standalone route.
  const senseCardPortalNode = useLessonSessionStore((state) => state.senseCardPortalNode);
  const autoPageIndex = pageIndexForVerse(layout.pages, activeVerse.verseNumber, activeWordIndex);
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

  function renderVerseWords(verse: VerseSegment, range: SenseLineWordRange) {
    return matches(verse) ? renderActiveVerse(verse, range) : undefined;
  }

  const segment = page?.segments[0];
  const heading = segment && (!isHeadingVisible || isHeadingVisible(segment)) ? segment.heading : undefined;
  const { previousEdgeVerse, nextEdgeVerse, prevGhostText, nextGhostText } = computeGhostContext(layout.pages, pageIndex);

  // The in-place Mind Map lesson sheet wants ABSOLUTELY NOTHING but the sense lines in its own
  // card — no title, no ghost context, no manual-flip arrows, and (see embeddedVerses' own doc
  // comment) no PAGE either — just this stage's own real verses.
  if (senseCardPortalNode) {
    return createPortal(
      <SheetVerseZone>
        <ChapterPageContent
          page={buildEmbeddedChapterPage(embeddedVerses ?? [activeVerse])}
          dayNumberByVerse={layout.dayNumberByVerse}
          todaysVerseNumbers={layout.todaysVerseNumbers}
          completedDays={layout.completedDays}
          locationTags={layout.locationTags}
          iconTags={layout.iconTags}
          pegActive={layout.pegActive}
          fontSizePx={layout.fontSizePx}
          renderVerseWords={renderVerseWords}
          isVerseNumberVisible={isVerseNumberVisible}
          onSelect={() => {}}
        />
      </SheetVerseZone>,
      senseCardPortalNode,
    );
  }

  const chapterPageContent = (
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
      isVerseNumberVisible={isVerseNumberVisible}
      onSelect={() => {}}
    />
  );

  return (
    <div className="flex flex-col">
      <PericopeTitle book={segment?.book} chapter={segment?.chapter} verseNumber={segment?.verses[0]?.verseNumber} heading={heading} />

      <GhostContextLine
        verse={previousEdgeVerse}
        text={prevGhostText}
        ellipsis="leading"
        align="left"
        onNavigate={allowManualFlip && pageIndex > 0 ? () => setManualPageIndex(pageIndex - 1) : undefined}
      />

      <ParchmentCard>
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
        {chapterPageContent}
      </ParchmentCard>

      {showNextGhost && (
        <GhostContextLine
          verse={nextEdgeVerse}
          text={nextGhostText}
          ellipsis="trailing"
          align="right"
          onNavigate={allowManualFlip && pageIndex < layout.pages.length - 1 ? () => setManualPageIndex(pageIndex + 1) : undefined}
        />
      )}
    </div>
  );
}
