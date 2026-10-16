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
import { edgeGhost } from "@/lib/verseEdgeGhost";
import { formatVerseRangeLabel } from "@/lib/chapterContent";
import { TEACHING_STAGE_LABELS } from "@/lib/learnSheetStage";
import { useReferenceGate } from "@/components/gamification/ReferenceGate";
import { senseLineSliceView } from "@/components/gamification/SenseLineSliceView";
import { usePublishHelpVerse } from "@/lib/usePublishHelpVerse";

interface LessonPageCardProps {
  layout: ChapterReadingLayout;
  // The verse drilled — for a multi-verse stage (`isActive`), whichever decides the page shown.
  activeVerse: VerseSegment;
  // Which verse(s) get `renderActiveVerse` (default `activeVerse` alone) — for a stage drilling
  // several verses on one page at once (ReviewChain.tsx's own combine stage).
  isActive?: (verse: VerseSegment) => boolean;
  // What to show in the active verse's place, called once per clause (senseLineWordRanges) — the
  // full verse, first letters, or blanks, in the same sense-line structure as every other verse.
  renderActiveVerse: (verse: VerseSegment, range: SenseLineWordRange) => ReactNode;
  // SRS review only — lets the reader flip between an entity's pages.
  allowManualFlip?: boolean;
  // SRS review only — hides the pericope title until it returns true.
  isHeadingVisible?: (segment: PericopeSegment) => boolean;
  isVerseNumberVisible?: (verse: VerseSegment) => boolean; // Blind recall: a verse number shows once true.
  activeWordIndex?: number; // The word the reader's on, for a verse split across a page break.
  // Hides the trailing ghost line (the verse zone shows it only on a Learn teaching stage anyway).
  showNextGhost?: boolean;
  // Hides the verse zone's reference and both ghost lines — a question asking where the verse is from.
  hideWhereFrom?: boolean;
  // The verses the lesson page's verse zone shows (no pagination there) — `[activeVerse]` by
  // default; LessonWholeDayPageCard.tsx passes its own list through.
  embeddedVerses?: VerseSegment[];
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
  hideWhereFrom = false,
  embeddedVerses,
}: LessonPageCardProps) {
  // A Learn recall stage's reference while it's being entered, in the reference's own place.
  const referenceSlot = useReferenceGate()?.slot;
  // The lesson page's verse zone (lib/useMindMapSenseCardSlot.ts) this portals into; null standalone.
  const senseCardPortalNode = useLessonSessionStore((state) => state.senseCardPortalNode);
  // The verse zone's verses — for a sense-line stage, its whole verse; the Letters / Verse tabs show them.
  const slice = senseCardPortalNode ? senseLineSliceView(activeVerse, renderActiveVerse) : null;
  const shownVerses = slice ? [slice.whole] : (embeddedVerses ?? [activeVerse]);
  usePublishHelpVerse(senseCardPortalNode ? shownVerses.map((verse) => verse.text).join(" ") : null);
  const stageLabel = useLessonSessionStore((state) => state.sheetStage?.label);
  const autoPageIndex = pageIndexForVerse(layout.pages, activeVerse.verseNumber, activeWordIndex);
  const [manualPageIndex, setManualPageIndex] = useState<number | null>(null);
  const [lastAutoPageIndex, setLastAutoPageIndex] = useState(autoPageIndex);
  // A manual flip snaps back once recall moves to a new page (adjusted during render).
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

  // The lesson page and the Mind Map sheet show just the stage's verses (no page) in the verse
  // zone (SheetVerseZone.tsx): fitted, no verse numbers, the reference at the top left, a ghost
  // line either side (just before, in a review). A sense-line stage: its whole verse (above).
  if (senseCardPortalNode) {
    const shown = shownVerses;
    const renderShown = slice ? (verse: VerseSegment, range: SenseLineWordRange) => (verse.id === slice.whole.id ? slice.renderLine(range) : undefined) : renderVerseWords;
    return createPortal(
      <SheetVerseZone
        fitKey={`${stageLabel}|${activeVerse.id}|${shown.map((verse) => verse.id).join(",")}`}
        reference={referenceSlot ?? (hideWhereFrom ? undefined : formatVerseRangeLabel(shown))}
        ghostPrev={hideWhereFrom ? undefined : edgeGhost(shown[0], "previous")}
        ghostNext={!hideWhereFrom && showNextGhost && stageLabel && TEACHING_STAGE_LABELS.has(stageLabel) ? edgeGhost(shown[shown.length - 1], "next") : undefined}
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
            renderVerseWords={renderShown}
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
      {referenceSlot && <div className="px-4 pb-2 font-serif text-xl text-brand-700 dark:text-brand-300">{referenceSlot}</div>}

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
