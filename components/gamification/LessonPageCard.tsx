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
import { edgeGhostText } from "@/lib/verseEdgeGhost";
import { formatVerseRangeLabel } from "@/lib/chapterContent";

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
  // What to show in the active verse's place, called once per clause (senseLineWordRanges) — the
  // full verse, first letters, or blanks, in the same sense-line structure as every other verse.
  renderActiveVerse: (verse: VerseSegment, range: SenseLineWordRange) => ReactNode;
  // SRS review only — lets the reader flip between an entity's pages (snaps back when recall
  // moves on to another page).
  allowManualFlip?: boolean;
  // SRS review only — hides the pericope title until it returns true (no early section leak).
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
  // In place of the reference above the verse — a Learn stage's reference being recalled.
  referenceSlot?: ReactNode;
}

// The Learn/Review "verse lives here" surface — the SAME real reading-view page (every verse
// that page actually holds, in full, at the exact coordinates it sits at while just browsing —
// see ChapterPageContent.tsx) at the SAME size/position/font as the Path screen's own reading
// view (lib/useChapterReadingLayout.ts), with only the one verse actually being drilled swapped
// for whatever this stage wants shown in its place. Doesn't render its own ChapterFitProbes.tsx
// — that's owned once by the caller (LearnSection.tsx), alongside `layout` itself.
//
// The title and ghost lines around the card are the reading view's own (PericopeTitle.tsx,
// GhostContextLine.tsx), on a plain ParchmentCard — the standalone route's shape; the lesson
// page and the Mind Map sheet get the portal branch below instead.
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
  referenceSlot,
}: LessonPageCardProps) {
  // The lesson page's or Mind Map sheet's verse zone (lib/useMindMapSenseCardSlot.ts), which this
  // portals into instead of rendering inline. Null on the standalone route.
  const senseCardPortalNode = useLessonSessionStore((state) => state.senseCardPortalNode);
  const stageLabel = useLessonSessionStore((state) => state.sheetStage?.label);
  const autoPageIndex = pageIndexForVerse(layout.pages, activeVerse.verseNumber, activeWordIndex);
  const [manualPageIndex, setManualPageIndex] = useState<number | null>(null);
  const [lastAutoPageIndex, setLastAutoPageIndex] = useState(autoPageIndex);
  // Adjusted during render (lib/useChapterPagination.ts's pattern): a manual flip snaps back
  // the moment recall itself moves to a new page.
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

  // The lesson page and the Mind Map sheet want just the stage's own verses (see embeddedVerses'
  // own doc comment — no PAGE), in the verse zone (SheetVerseZone.tsx): fitted to it, no verse
  // numbers, their reference under them at the right and a ghost line of the verse either side.
  if (senseCardPortalNode) {
    const shown = embeddedVerses ?? [activeVerse];
    return createPortal(
      <SheetVerseZone
        fitKey={`${stageLabel}|${shown.map((verse) => verse.id).join(",")}`}
        reference={referenceSlot ?? formatVerseRangeLabel(shown)}
        ghostPrev={edgeGhostText(shown[0], "previous")}
        ghostNext={edgeGhostText(shown[shown.length - 1], "next")}
      >
        {(fontSizePx) => (
          <ChapterPageContent
            page={buildEmbeddedChapterPage(shown)}
            dayNumberByVerse={layout.dayNumberByVerse}
            todaysVerseNumbers={layout.todaysVerseNumbers}
            completedDays={layout.completedDays}
            locationTags={layout.locationTags}
            iconTags={layout.iconTags}
            pegActive={layout.pegActive}
            fontSizePx={fontSizePx}
            renderVerseWords={renderVerseWords}
            isVerseNumberVisible={() => false}
            onSelect={() => {}}
          />
        )}
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
      {referenceSlot && <div className="self-end px-4 pt-2 text-right font-serif text-xl text-brand-700 dark:text-brand-300">{referenceSlot}</div>}

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
