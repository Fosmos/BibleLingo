import type { ReactNode } from "react";
import type { VerseSegment } from "@/types";
import type { ChapterPage } from "@/lib/chapterPagination";
import type { SenseLineWordRange } from "@/lib/senseLineWordRanges";
import { buildDayRuns, runState } from "@/lib/chapterReadingRuns";
import { SenseLineVerse } from "@/components/gamification/SenseLineVerse";

interface ChapterPageContentProps {
  page: ChapterPage | undefined;
  dayNumberByVerse: Map<number, number>;
  todaysVerseNumbers: Set<number>;
  completedDays: number;
  locationTags: Record<string, string>;
  iconTags: Record<string, string>;
  pegActive: boolean;
  fontSizePx?: number;
  // See SenseLineVerse.tsx's own doc comment — Learn/Review only, passed straight through.
  renderVerseWords?: (verse: VerseSegment, range: SenseLineWordRange) => ReactNode | undefined;
  // See ChapterVerseRun.tsx — blind-recall drills pass this to keep a verse's number hidden
  // until the word before it is recalled; every other caller leaves it undefined.
  isVerseNumberVisible?: (verse: VerseSegment) => boolean;
  onSelect: (dayNumber: number | undefined) => void;
}

// One page's own verse — a page always holds exactly one (see lib/chapterPagination.ts), laid
// out as its own real sense-line clause blocks (see lib/senseLines.ts, SenseLineVerse.tsx)
// rather than flowing paragraph text, every clause its own indented, hanging-wrapped line. Split
// out of ChapterReadingView.tsx so the SAME markup can render both the one page actually on
// screen and, hidden, every other page at once for lib/useUniformFitText.ts's own measurement
// pass. Kept deliberately free of the interactive swipe/fold chrome around it, and of the
// pericope title too — that now renders OUTSIDE the card entirely (see ChapterReadingView.tsx/
// LessonPageCard.tsx's own PericopeTitle), so it can persist across every page a pericope's
// verses span rather than showing once and disappearing. No `leading-*` on this wrapper — every
// clause row sets its own directly (see SenseLineVerse.tsx's own SenseLineRow), since the
// within-clause vs. between-clause gaps are now two genuinely different values, not one
// inherited constant every row shared.
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
  isVerseNumberVisible,
  onSelect,
}: ChapterPageContentProps) {
  return (
    <div data-fit-text className="flex flex-col gap-3" style={fontSizePx ? { fontSize: `${fontSizePx}px` } : undefined}>
      {page?.segments.map((segment) => (
        <div key={segment.key} className="font-reading text-lg font-medium">
          {buildDayRuns(segment.verses, dayNumberByVerse)
            .flatMap((run) => run.verses.map((verse) => ({ verse, dayNumber: run.dayNumber })))
            .map(({ verse, dayNumber }) => (
              <SenseLineVerse
                key={verse.id}
                verse={verse}
                dayNumber={dayNumber}
                state={runState({ dayNumber, verses: [verse] }, completedDays, todaysVerseNumbers)}
                locationTags={locationTags}
                iconTags={iconTags}
                pegActive={pegActive}
                pegAnchorVerse={segment.startVerse}
                renderVerseWords={renderVerseWords}
                isVerseNumberVisible={isVerseNumberVisible}
                onSelect={onSelect}
              />
            ))}
        </div>
      ))}
    </div>
  );
}
