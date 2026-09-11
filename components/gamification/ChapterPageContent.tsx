import type { ReactNode } from "react";
import type { VerseSegment } from "@/types";
import type { ChapterPage } from "@/lib/chapterPagination";
import type { PericopeSegment } from "@/lib/pathZones";
import { buildDayRuns, runState } from "@/lib/chapterReadingRuns";
import { ChapterVerseRun } from "@/components/gamification/ChapterVerseRun";
import { ParchmentHeadingCaption } from "@/components/ui/ParchmentHeadingCaption";

interface ChapterPageContentProps {
  page: ChapterPage | undefined;
  dayNumberByVerse: Map<number, number>;
  todaysVerseNumbers: Set<number>;
  completedDays: number;
  locationTags: Record<string, string>;
  iconTags: Record<string, string>;
  pegActive: boolean;
  fontSizePx?: number;
  // See ChapterVerseRun.tsx's own doc comment — Learn/Review only, passed straight through.
  renderVerseWords?: (verse: VerseSegment) => ReactNode | undefined;
  // SRS review only (see FirstLetterMultiVersePageCard.tsx) — a mid-page pericope heading
  // stays hidden until this returns true for its own segment. Defaults to always-visible, the
  // same decorative-never-blocking treatment every other caller (the reading view, Learn) uses
  // — a blind recall test is the one place a heading shouldn't leak a section's own boundary
  // ahead of actually reaching it.
  isHeadingVisible?: (segment: PericopeSegment) => boolean;
  // See ChapterVerseRun.tsx — blind-recall drills pass this to keep a verse's number hidden
  // until the word before it is recalled; every other caller leaves it undefined.
  isVerseNumberVisible?: (verse: VerseSegment) => boolean;
  onSelect: (dayNumber: number | undefined) => void;
}

// One page's own heading(s) + verse-run paragraph(s) — split out of ChapterReadingView.tsx so
// the SAME markup can render both the one page actually on screen and, hidden, every other
// page at once for lib/useUniformFitText.ts's own measurement pass (see its own doc comment on
// why a real font size needs to be found against every page, not just the current one). Kept
// deliberately free of the interactive swipe/fold chrome around it — that stays in
// ChapterReadingView.tsx, which a hidden measurement pass has no use for.
export function ChapterPageContent({
  page,
  dayNumberByVerse,
  todaysVerseNumbers,
  completedDays,
  locationTags,
  iconTags,
  pegActive,
  fontSizePx,
  renderVerseWords,
  isHeadingVisible,
  isVerseNumberVisible,
  onSelect,
}: ChapterPageContentProps) {
  return (
    <div className="flex flex-col gap-3">
      {page?.segments.map((segment) => (
        <div key={segment.key}>
          <ParchmentHeadingCaption heading={isHeadingVisible && !isHeadingVisible(segment) ? undefined : segment.heading} />
          <p data-fit-text className="font-serif text-lg leading-loose" style={fontSizePx ? { fontSize: `${fontSizePx}px` } : undefined}>
            {buildDayRuns(segment.verses, dayNumberByVerse).map((run, runIndex) => (
              <ChapterVerseRun
                key={runIndex}
                run={run}
                state={runState(run, completedDays, todaysVerseNumbers)}
                locationTags={locationTags}
                iconTags={iconTags}
                pegActive={pegActive}
                pegAnchorVerse={segment.startVerse}
                renderVerseWords={renderVerseWords}
                isVerseNumberVisible={isVerseNumberVisible}
                onSelect={onSelect}
              />
            ))}
          </p>
        </div>
      ))}
    </div>
  );
}
