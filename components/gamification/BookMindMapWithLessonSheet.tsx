"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { MemorizationDay, VerseSegment } from "@/types";
import type { MindMapPericopeDatum } from "@/lib/mindMapHierarchy";
import type { VerseLessonAction } from "@/lib/verseLessonAction";
import { useMindMapData } from "@/lib/useMindMapData";
import { useVerseLessonSource } from "@/lib/useVerseLessonSource";
import { useActivePathKeys } from "@/lib/useActivePathKeys";
import { useLessonSessionStore, type LessonFocusVerse } from "@/store/useLessonSessionStore";
import { MindMapScreen } from "@/components/gamification/MindMapScreen";
import { InPlaceLessonSession } from "@/components/gamification/InPlaceLessonSession";
import { LessonBottomSheet } from "@/components/gamification/LessonBottomSheet";
import { MindMapSheetBreadcrumb } from "@/components/gamification/MindMapSheetBreadcrumb";
import { MindMapVersePreview } from "@/components/gamification/MindMapVersePreview";
import { InPlaceSrsReview } from "@/components/gamification/InPlaceSrsReview";
import { MindMapReviewDueButton } from "@/components/gamification/MindMapReviewDueButton";
import { MindMapPathTab } from "@/components/gamification/MindMapPathTab";
import { MindMapPathSetup } from "@/components/gamification/MindMapPathSetup";
import { MindMapPathsMenu } from "@/components/gamification/MindMapPathsMenu";
import { MindMapVerseTargetPreview } from "@/components/gamification/MindMapVerseTargetPreview";
import { isCoveredByActivePath, pathTargetOfKey, type PathTarget } from "@/lib/mindMapPathTarget";
import { singleVersePathHref, startLessonSheet } from "@/lib/singleVersePath";
import { verseHallAccent } from "@/lib/mindMapGenreColor";

interface BookMindMapWithLessonSheetProps {
  pathKey: string;
  label: string;
  days: MemorizationDay[];
  verses: VerseSegment[];
  version: string;
  completedDays: number;
  todaysDay: number;
  onSelectChapter: (chapter: number, startVerse?: number) => void;
  // Open straight into this single-verse path's lesson ("Learn just vN", lib/singleVersePath.ts).
  autoStartLesson?: boolean;
}

// A tapped verse (previewed, then its lesson), an SRS review run, a verse pick, or a path setup.
type SheetState =
  | {
      kind: "verse";
      tappedVerse: LessonFocusVerse;
      // Null while the sheet is just previewing the tapped verse; set once its action is taken.
      lesson: { dayNumber: number; mode: "select" | "practice" } | null;
    }
  | { kind: "srs"; entityIds: string[] }
  // A verse tapped outside the active paths, shown with "Memorize" (MindMapVerseTargetPreview.tsx).
  | { kind: "versePick"; target: Extract<PathTarget, { kind: "verse" }> }
  // A new path's setup, picked on the map (see MindMapPathTab.tsx/MindMapPathSetup.tsx).
  | { kind: "setup"; target: PathTarget };

// PathOverviewScreen.tsx's own book-mode Mind Map screen, plus the tab a verse-chip tap slides
// up over it (see LessonBottomSheet.tsx): first a preview of that verse with its one action
// (MindMapVersePreview.tsx), then — in the same sheet — the lesson or review that action starts.
// PathOverviewScreen.tsx remounts this fresh on every path switch (its `key={pathKey}`).
export function BookMindMapWithLessonSheet({ pathKey, label, days, verses, version, completedDays, todaysDay, onSelectChapter, autoStartLesson }: BookMindMapWithLessonSheetProps) {
  const [sheet, setSheet] = useState<SheetState | null>(() => (autoStartLesson ? startLessonSheet(pathKey, days) : null));
  const router = useRouter();
  // The book/chapter/verse last tapped outside this path — the small path tab offering it.
  const [pathTarget, setPathTarget] = useState<PathTarget | null>(null);
  // The map draws the broadest active path around this one (see lib/useMindMapData.ts).
  const mapData = useMindMapData(pathKey);
  const activeKeys = useActivePathKeys();
  const setStoreFocusVerse = useLessonSessionStore((state) => state.setFocusVerse);
  const clearStoreFocusVerse = useLessonSessionStore((state) => state.clearFocusVerse);
  const setLessonProgress = useLessonSessionStore((state) => state.setLessonProgress);
  const beginSession = useLessonSessionStore((state) => state.begin);
  const endSession = useLessonSessionStore((state) => state.end);
  // The live, currently-drilled verse — any book: an SRS review run travels across books.
  const liveFocusVerse = useLessonSessionStore((state) => state.focusVerse);
  const isOpen = sheet !== null;

  // The sheet covers the screen bottom — hide the tab bar the whole time it's up (see AuthGate.tsx).
  useEffect(() => {
    if (!isOpen) return;
    beginSession();
    return endSession;
  }, [isOpen, beginSession, endSession]);

  function openSheet(pericope: MindMapPericopeDatum, verseNumber: number) {
    const tappedVerse = { book: pericope.book, chapter: pericope.chapter, verseNumber };
    setSheet({ kind: "verse", tappedVerse, lesson: null });
    setLessonProgress(null);
    setStoreFocusVerse(tappedVerse);
  }

  function startLesson(action: VerseLessonAction) {
    setSheet((prev) => (prev?.kind === "verse" ? { ...prev, lesson: { dayNumber: action.dayNumber, mode: action.mode } } : prev));
  }

  // A tapped verse opens its preview in the sheet (the map zooms to it); a book/chapter pops the path tab.
  function choosePath(target: PathTarget) {
    // Already inside another of the reader's paths: offer to switch to that one (never to start a
    // second, overlapping path over the same verses).
    const owner = activeKeys.find((key) => isCoveredByActivePath(target, key));
    const ownerTarget = owner ? pathTargetOfKey(owner) : undefined;
    if (ownerTarget) {
      setPathTarget(ownerTarget);
      return;
    }
    if (target.kind !== "verse") {
      setPathTarget(target);
      return;
    }
    setPathTarget(null);
    setSheet({ kind: "versePick", target });
    setLessonProgress(null);
    setStoreFocusVerse({ book: target.book, chapter: target.chapter, verseNumber: target.verse });
  }

  function startSetup(target: PathTarget) {
    setPathTarget(null);
    setSheet({ kind: "setup", target });
  }

  function startReview(entityIds: string[]) {
    setSheet({ kind: "srs", entityIds });
    setLessonProgress(0);
  }

  function closeSheet() {
    setSheet(null);
    setLessonProgress(null);
    clearStoreFocusVerse();
  }

  const verseSheet = sheet?.kind === "verse" ? sheet : null;
  const tapped = verseSheet?.tappedVerse;
  const page = { pathKey, label, days, verses, version, completedDays, todaysDay };
  const { source, previewVerse, action, canLearnSingleVerse } = useVerseLessonSource(page, mapData, tapped, !!verseSheet && !verseSheet.lesson);
  const lessonSource = source ?? page;
  // Keyed only on the sheet being open — never on the live focus verse alone — so its Back button
  // can't vanish mid-lesson; the tapped verse stands in until the lesson reports its own.
  const breadcrumbVerse = liveFocusVerse ?? tapped;

  return (
    <>
      {sheet && breadcrumbVerse && (
        <MindMapSheetBreadcrumb book={breadcrumbVerse.book} chapter={breadcrumbVerse.chapter} verseNumber={breadcrumbVerse.verseNumber} onExit={closeSheet} />
      )}
      <div className="relative">
        <MindMapScreen
          data={mapData}
          onSelectChapter={onSelectChapter}
          onSelectVerseForLesson={openSheet}
          onChoosePath={choosePath}
          focusVerse={liveFocusVerse ?? undefined}
          heightClassName={isOpen ? "h-[100dvh]" : undefined}
        />
        {!isOpen && !pathTarget && <MindMapReviewDueButton onStart={startReview} />}
        {!isOpen && <MindMapPathsMenu />}
      </div>
      <MindMapPathTab target={isOpen ? null : pathTarget} onMemorize={startSetup} onClose={() => setPathTarget(null)} />
      <LessonBottomSheet
        open={isOpen}
        plain={sheet?.kind === "setup"}
        accentColor={breadcrumbVerse ? verseHallAccent(breadcrumbVerse.book, breadcrumbVerse.chapter) : undefined}
      >
        {sheet?.kind === "versePick" ? (
          <MindMapVerseTargetPreview target={sheet.target} version={version} onMemorize={() => startSetup(sheet.target)} />
        ) : sheet?.kind === "setup" ? (
          <MindMapPathSetup target={sheet.target} onClose={closeSheet} />
        ) : sheet?.kind === "srs" ? (
          <InPlaceSrsReview entityIds={sheet.entityIds} onExit={closeSheet} />
        ) : verseSheet?.lesson ? (
          <InPlaceLessonSession
            key={`${lessonSource.pathKey}:${verseSheet.lesson.dayNumber}:${verseSheet.lesson.mode}`}
            pathKey={lessonSource.pathKey}
            label={lessonSource.label}
            days={lessonSource.days}
            verses={lessonSource.verses}
            version={lessonSource.version}
            completedDays={lessonSource.completedDays}
            todaysDay={lessonSource.todaysDay}
            dayNumber={verseSheet.lesson.dayNumber}
            mode={verseSheet.lesson.mode}
            embeddedInMindMap
            onExit={closeSheet}
          />
        ) : (
          verseSheet && (
            <MindMapVersePreview
              verse={previewVerse}
              learned={action?.mode === "practice"}
              actionLabel={action?.label}
              onAction={() => action && startLesson(action)}
              secondary={
                tapped && canLearnSingleVerse
                  ? { label: `Learn just v${tapped.verseNumber}`, onClick: () => router.push(singleVersePathHref(tapped.book, tapped.chapter, tapped.verseNumber, lessonSource.version)) }
                  : undefined
              }
            />
          )
        )}
      </LessonBottomSheet>
    </>
  );
}
