"use client";

import type { MindMapData } from "@/lib/useMindMapData";
import { BIBLE_VERSIONS } from "@/lib/bibleVersions";
import type { PathTarget } from "@/lib/mindMapPathTarget";
import type { MindMapPericopeDatum } from "@/lib/mindMapHierarchy";
import { BookMindMap } from "@/components/gamification/BookMindMap";
import { FetchLoading, FetchError } from "@/components/ui/FetchStatus";

interface MindMapScreenProps {
  // The drawn path's data — from the caller's own useMindMapData, which may need it too (the
  // lesson sheet runs lessons of the drawn path, see BookMindMapWithLessonSheet.tsx).
  data: MindMapData;
  onSelectChapter: (chapter: number, startVerse?: number) => void;
  // See BookMindMap.tsx's own doc comment — threaded straight through.
  onSelectVerseForLesson?: (pericope: MindMapPericopeDatum, verseNumber: number) => void;
  // See BookMindMap.tsx's own doc comment — threaded straight through.
  focusVerse?: { book?: string; chapter: number; verseNumber: number };
  // See BookMindMap.tsx's own doc comment — threaded straight through.
  onChoosePath: (target: PathTarget) => void;
  // See BookMindMap.tsx's own doc comment — threaded straight through.
  onTapChapter?: (book: string, chapter: number) => void;
  // Overrides the canvas's own default full-screen height — PathOverviewScreen.tsx passes a
  // shorter one while its own in-place lesson bottom sheet is open, so the canvas shrinks to
  // fill just the space left above it instead of sitting underneath it at full height.
  heightClassName?: string;
}

// The Book path's own landing screen: a free pan/zoom view of the WHOLE canon's own
// Bible -> Testament -> Genre -> Book -> Chapter -> Pericope tree, opening centered on the
// active book (see PathOverviewScreen.tsx, which renders this whenever no chapter has been
// opened yet). Tapping a pericope opens that chapter's own parchment view; tapping a different
// book switches the active path to it (see BookMindMap.tsx's own doc comment) — this screen
// itself never navigates on its own beyond wiring those two actions through. All the real data
// work for the ACTIVE book (loading verses, building the day plan, slicing it per chapter)
// lives in lib/useMindMapData.ts (called by this screen's host); every other book's own shell (label, chapter count,
// completion badge) is cheap, static data lib/mindMapHierarchy.ts pulls in directly.
export function MindMapScreen({ data, onSelectChapter, onSelectVerseForLesson, focusVerse, onChoosePath, onTapChapter, heightClassName }: MindMapScreenProps) {
  const heightClass = heightClassName ?? "h-[calc(100dvh-63px-env(safe-area-inset-bottom))]";

  if (data.status === "loading") {
    return <FetchLoading label="Loading mind map…" />;
  }

  if (data.status === "error") {
    return <FetchError message={data.message} onRetry={data.retry} />;
  }

  // No book/chapter/verse path yet (or a topic path): the whole canon, nothing active — every
  // tap offers a path (see onChoosePath), so this IS where a path gets picked.
  if (data.status === "no-path") {
    return (
      <div className={`${heightClass} w-full`}>
        <BookMindMap
          pathKey={null}
          bookLabel=""
          chapters={[]}
          completedDays={0}
          todaysDay={0}
          version={BIBLE_VERSIONS[0].code}
          onSelectChapter={onSelectChapter}
          onChoosePath={onChoosePath}
        />
      </div>
    );
  }

  return (
    // AuthGate.tsx's <main> wraps every page in flex-1 inside a body that's only min-h-full
    // (a floor, not a ceiling) — so a plain flex-1 chain here has no definite height to fill
    // and the SVG below falls back to its own intrinsic (viewBox aspect-ratio) size instead,
    // growing the whole page taller than the viewport. Sizing directly off 100dvh instead
    // gives a height that's definite from the very first div, so the canvas below can
    // actually fill it — minus BottomTabBar.tsx's own REAL rendered height (63px measured,
    // not the `pb-20`/5rem <main> reserves below it, which runs taller than the bar actually
    // is and left a visible strip of plain page background between this screen's own solid
    // `mist` canvas and the bar above it) plus its own safe-area inset, so this box's bottom
    // edge lines up exactly with the bar's own top edge on every device. If BottomTabBar.tsx's
    // own height ever changes, update the 63px here to match.
    // No explanation bar above this, no wrapper padding/border below whatever sits above this
    // screen — the canvas fills this entire box itself, edge to edge, with nothing between it
    // and the top of the box to read as a gap.
    <div className={`${heightClass} w-full`}>
      <BookMindMap
        pathKey={data.pathKey}
        bookLabel={data.label}
        chapters={data.chapters}
        completedDays={data.completedDays}
        todaysDay={data.todaysDay}
        version={data.version}
        onSelectChapter={onSelectChapter}
        onSelectVerseForLesson={onSelectVerseForLesson}
        focusVerse={focusVerse}
        onChoosePath={onChoosePath}
        onTapChapter={onTapChapter}
      />
    </div>
  );
}
