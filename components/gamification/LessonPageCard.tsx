"use client";

import { useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { VerseSegment } from "@/types";
import type { ChapterReadingLayout } from "@/lib/useChapterReadingLayout";
import type { PericopeSegment } from "@/lib/pathZones";
import type { SenseLineWordRange } from "@/lib/senseLineWordRanges";
import { pageIndexForVerse } from "@/lib/chapterPagination";
import { computeGhostContext } from "@/lib/ghostContext";
import { ChapterPageContent } from "@/components/gamification/ChapterPageContent";
import { PericopeTitle } from "@/components/gamification/PericopeTitle";
import { GhostContextLine } from "@/components/gamification/GhostContextLine";
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
  // What to show in the active verse's own place, called ONCE PER CLAUSE (see
  // lib/senseLines.ts's own senseLineWordRanges and SenseLineVerse.tsx's own doc comment on
  // renderVerseWords) — the full verse, first letters only, or fully blanked, depending on the
  // stage, but always through the SAME multi-line clause structure every other verse gets.
  // Each verse's own number/underline/pericope title around it always render the same
  // regardless.
  renderActiveVerse: (verse: VerseSegment, range: SenseLineWordRange) => ReactNode;
  // SRS review only (see FirstLetterMultiVersePageCard.tsx) — an entity can span several real
  // pages, unlike a single Learn day's own verses (always sized to fit one). Set to let the
  // reader manually flip between them (same ChevronLeft/ChevronRight arrows
  // ChapterReadingView.tsx uses), rather than being locked to whichever page `activeVerse`
  // currently sits on. A manual flip always snaps back the moment `activeVerse` itself moves to
  // a DIFFERENT page (recall progressing forward) — it's a peek, not a way to get lost from
  // wherever recall actually is.
  allowManualFlip?: boolean;
  // SRS review only — see PericopeTitle.tsx. The page's own pericope title (rendered outside
  // the card, like ChapterReadingView.tsx's own) stays hidden until this returns true for its
  // own segment — a blind recall test is the one place a title shouldn't leak a section's own
  // boundary ahead of actually reaching it.
  isHeadingVisible?: (segment: PericopeSegment) => boolean;
  // Blind-recall drills only — see ChapterVerseRun.tsx. A verse's number stays hidden until
  // this returns true (the word before it has been recalled).
  isVerseNumberVisible?: (verse: VerseSegment) => boolean;
  // The word index (into `activeVerse.text`'s own tokenizeVerseWords) the reader's actually
  // on right now — only meaningful when `activeVerse` can be split across a page break (see
  // lib/chapterPagination.ts's splitVerseAtLineBudget) and the caller reveals it progressively
  // word by word (RhythmRep, FirstLetterTypeRep, WordTypeEntry, DrawFirstLetterRep, ...).
  // Undefined keeps the old "always this verse's first page" behavior — fine for a caller that
  // only ever shows a verse in full at once, never mid-reveal.
  activeWordIndex?: number;
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
//
// The pericope title above the card and the ghost-context lines above/below it (see
// PericopeTitle.tsx/GhostContextLine.tsx/lib/ghostContext.ts) are the exact same shared
// components ChapterReadingView.tsx renders — same markup, same classes, same spacing — so a
// reader sees no difference between browsing a page and drilling it mid-lesson beyond the one
// verse actually being tested. The card itself is the plain, content-sized ParchmentCard too
// (no `fill`), for the same reason: a short page (1-3 verses) should be exactly as tall here as
// it is on the Path screen, not artificially stretched to fill this stage's own available
// space.
export function LessonPageCard({
  layout,
  activeVerse,
  isActive,
  renderActiveVerse,
  allowManualFlip,
  isHeadingVisible,
  isVerseNumberVisible,
  activeWordIndex,
}: LessonPageCardProps) {
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
      </ParchmentCard>

      <GhostContextLine
        verse={nextEdgeVerse}
        text={nextGhostText}
        ellipsis="trailing"
        align="right"
        onNavigate={allowManualFlip && pageIndex < layout.pages.length - 1 ? () => setManualPageIndex(pageIndex + 1) : undefined}
      />
    </div>
  );
}
