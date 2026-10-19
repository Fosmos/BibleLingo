"use client";

import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import type { VerseSegment } from "@/types";
import type { ChapterReadingLayout } from "@/lib/useChapterReadingLayout";
import type { SenseLineWordRange } from "@/lib/senseLineWordRanges";
import { buildEmbeddedChapterPage } from "@/lib/buildEmbeddedChapterPage";
import { useLessonSessionStore } from "@/store/useLessonSessionStore";
import { useProgressStore } from "@/store/useProgressStore";
import { ChapterPageContent } from "@/components/gamification/ChapterPageContent";
import { SheetVerseZone } from "@/components/gamification/SheetVerseZone";
import { InlineVerseWords } from "@/components/gamification/InlineVerseWords";
import { edgeGhost } from "@/lib/verseEdgeGhost";
import { formatVerseRangeLabel } from "@/lib/chapterContent";
import { TEACHING_STAGE_LABELS } from "@/lib/learnSheetStage";

interface LessonVerseZoneProps {
  // Where the stage's verse lives: the lesson page's verse zone, the Mind Map sheet's, or the verse's
  // own row (or place mid-paragraph) in the chapter reader (PathLessonVerseSlot.tsx).
  node: HTMLElement;
  verses: VerseSegment[];
  render: (verse: VerseSegment, range: SenseLineWordRange) => ReactNode;
  layout: ChapterReadingLayout;
  activeVerseId: string;
  // A Learn recall stage's reference while it's being entered (ReferenceGate.tsx).
  referenceSlot: ReactNode | undefined;
  hideWhereFrom: boolean;
  showNextGhost: boolean;
}

// LessonPageCard.tsx's verse zone (SheetVerseZone.tsx): just the stage's verses, no page — on the
// lesson page fitted, with the reference at the top left and a ghost line either side (just before,
// in a review); in a reader row at the reader's own size, no ghost lines; and mid-paragraph, the
// words flowing inline (InlineVerseWords.tsx), so nothing moves from where the reader had it.
export function LessonVerseZone({ node, verses, render, layout, activeVerseId, referenceSlot, hideWhereFrom, showNextGhost }: LessonVerseZoneProps) {
  const stageLabel = useLessonSessionStore((state) => state.sheetStage?.label);
  const showPrevious = useProgressStore((state) => state.previousLineShown) ?? true; // Profile > Advanced.
  const inRow = useLessonSessionStore((state) => state.verseInRow);
  const flow = useLessonSessionStore((state) => state.verseInline);

  return createPortal(
    <SheetVerseZone
      fitKey={`${stageLabel}|${activeVerseId}|${verses.map((verse) => verse.id).join(",")}`}
      inline={inRow}
      flow={flow}
      reference={referenceSlot ?? (hideWhereFrom || inRow ? undefined : formatVerseRangeLabel(verses))}
      ghostPrev={hideWhereFrom || !showPrevious || inRow ? undefined : edgeGhost(verses[0], "previous")}
      ghostNext={!hideWhereFrom && !inRow && showNextGhost && stageLabel && TEACHING_STAGE_LABELS.has(stageLabel) ? edgeGhost(verses[verses.length - 1], "next") : undefined}
    >
      {(fontSizePx) =>
        flow ? (
          <InlineVerseWords verses={verses} render={render} />
        ) : (
          <ChapterPageContent
            page={buildEmbeddedChapterPage(verses)}
            dayNumberByVerse={layout.dayNumberByVerse}
            todaysVerseNumbers={layout.todaysVerseNumbers}
            completedDays={layout.completedDays}
            locationTags={layout.locationTags}
            iconTags={layout.iconTags}
            pegActive={layout.pegActive}
            fontSizePx={fontSizePx}
            renderVerseWords={render}
            isVerseNumberVisible={() => false}
            onSelect={() => {}}
          />
        )
      }
    </SheetVerseZone>,
    node,
  );
}
