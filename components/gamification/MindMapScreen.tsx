"use client";

import { useMindMapData } from "@/lib/useMindMapData";
import { useSwitchBookPath } from "@/lib/useSwitchBookPath";
import { BookMindMap } from "@/components/gamification/BookMindMap";
import { Button } from "@/components/ui/Button";
import { FetchLoading, FetchError } from "@/components/ui/FetchStatus";

interface MindMapScreenProps {
  onSelectChapter: (chapter: number, startVerse?: number) => void;
}

// The Book path's own landing screen: a free pan/zoom view of the WHOLE canon's own
// Bible -> Testament -> Genre -> Book -> Chapter -> Pericope tree, opening centered on the
// active book (see PathOverviewScreen.tsx, which renders this whenever no chapter has been
// opened yet). Tapping a pericope opens that chapter's own parchment view; tapping a different
// book switches the active path to it (see BookMindMap.tsx's own doc comment) — this screen
// itself never navigates on its own beyond wiring those two actions through. All the real data
// work for the ACTIVE book (loading verses, building the day plan, slicing it per chapter)
// lives in lib/useMindMapData.ts; every other book's own shell (label, chapter count,
// completion badge) is cheap, static data lib/mindMapHierarchy.ts pulls in directly.
export function MindMapScreen({ onSelectChapter }: MindMapScreenProps) {
  const data = useMindMapData();
  const switchBook = useSwitchBookPath(data.status === "ready" ? data.version : "");

  if (data.status === "loading") {
    return <FetchLoading label="Loading mind map…" />;
  }

  if (data.status === "error") {
    return <FetchError message={data.message} onRetry={data.retry} />;
  }

  if (data.status === "no-path") {
    return (
      <div className="mx-auto flex h-full w-full max-w-md flex-col items-center justify-center gap-4 p-8 text-center">
        <h1 className="text-title text-ink dark:text-zinc-100">No book path active</h1>
        <p className="text-ink-muted">The Mind Map only works for a Book path — start or switch to one to see its chapter/pericope tree here.</p>
        <Button href="/begin">Choose a path</Button>
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
    <div className="h-[calc(100dvh-63px-env(safe-area-inset-bottom))] w-full">
      <BookMindMap
        bookLabel={data.label}
        chapters={data.chapters}
        completedDays={data.completedDays}
        todaysDay={data.todaysDay}
        version={data.version}
        onSelectChapter={onSelectChapter}
        onSwitchBook={switchBook}
      />
    </div>
  );
}
