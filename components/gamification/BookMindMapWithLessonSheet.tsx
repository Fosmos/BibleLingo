"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { MemorizationDay, VerseSegment } from "@/types";
import type { MindMapPericopeDatum } from "@/lib/mindMapHierarchy";
import type { VerseLessonAction } from "@/lib/verseLessonAction";
import { useMindMapData } from "@/lib/useMindMapData";
import { useVerseLessonSource } from "@/lib/useVerseLessonSource";
import { useActivePathKeys } from "@/lib/useActivePathKeys";
import { useLessonSessionStore } from "@/store/useLessonSessionStore";
import { MindMapScreen } from "@/components/gamification/MindMapScreen";
import { InPlaceLessonSession } from "@/components/gamification/InPlaceLessonSession";
import { LessonBottomSheet } from "@/components/gamification/LessonBottomSheet";
import { MindMapSheetBreadcrumb } from "@/components/gamification/MindMapSheetBreadcrumb";
import { MindMapVersePreview } from "@/components/gamification/MindMapVersePreview";
import { InPlaceSrsReview } from "@/components/gamification/InPlaceSrsReview";
import { MindMapCornerTools } from "@/components/gamification/MindMapCornerTools";
import { MindMapReviewTab } from "@/components/gamification/MindMapReviewTab";
import { useMindMapReviewOffer } from "@/lib/useMindMapReviewOffer";
import { useHideTabBarWhile } from "@/lib/useHideTabBarWhile";
import { useReviewArrival } from "@/lib/useReviewArrival";
import { MindMapPathTab } from "@/components/gamification/MindMapPathTab";
import { MindMapPathSetup } from "@/components/gamification/MindMapPathSetup";
import { MindMapPathsMenu } from "@/components/gamification/MindMapPathsMenu";
import { MindMapVerseTargetPreview } from "@/components/gamification/MindMapVerseTargetPreview";
import { isCoveredByActivePath, pathTargetOfKey, type PathTarget } from "@/lib/mindMapPathTarget";
import { startLessonSheet } from "@/lib/singleVersePath";
import { versePreviewSecondary } from "@/lib/versePreviewSecondary";
import { verseHallAccent } from "@/lib/mindMapGenreColor";
import type { SheetState } from "@/lib/mindMapSheetState";
import type { RelearnTarget } from "@/lib/relearnTarget";
import { InPlaceRelearnSession } from "@/components/gamification/InPlaceRelearnSession";

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

// The book-mode Mind Map plus the sheet a verse-chip tap slides up (LessonBottomSheet.tsx): the
// verse's preview, then the lesson or review it starts. Remounted on every path switch.
export function BookMindMapWithLessonSheet({ pathKey, label, days, verses, version, completedDays, todaysDay, onSelectChapter, autoStartLesson }: BookMindMapWithLessonSheetProps) {
  const [sheet, setSheet] = useState<SheetState | null>(() => (autoStartLesson ? startLessonSheet(pathKey, days) : null));
  const router = useRouter();
  // The book/chapter/verse last tapped outside this path — the small path tab offering it.
  const [pathTarget, setPathTarget] = useState<PathTarget | null>(null);
  // A tapped verse due for review, or a tapped chapter, offers its review (MindMapReviewTab.tsx).
  // The map draws the broadest active path around this one (see lib/useMindMapData.ts).
  const mapData = useMindMapData(pathKey);
  const review = useMindMapReviewOffer(mapData.status === "ready" ? mapData.days : days);
  useReviewArrival(review.offerVerse);
  const activeKeys = useActivePathKeys();
  const setStoreFocusVerse = useLessonSessionStore((state) => state.setFocusVerse);
  const clearStoreFocusVerse = useLessonSessionStore((state) => state.clearFocusVerse);
  const setLessonProgress = useLessonSessionStore((state) => state.setLessonProgress);
  // The live, currently-drilled verse — any book: an SRS review run travels across books.
  const liveFocusVerse = useLessonSessionStore((state) => state.focusVerse);
  const isOpen = sheet !== null;

  useHideTabBarWhile(isOpen);

  function openSheet(pericope: MindMapPericopeDatum, verseNumber: number) {
    if (review.offerVerse(pericope.book, pericope.chapter, verseNumber)) return;
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
    const offered = target.kind === "verse" ? review.offerVerse(target.book, target.chapter, target.verse) : target.kind === "chapter" ? review.offerChapter(target.book, target.chapter) : (review.clear(), false);
    if (offered) return setPathTarget(null);
    // Already inside another of the reader's paths: offer to switch to that one.
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
    review.clear();
    setSheet({ kind: "srs", entityIds });
    setLessonProgress(0);
  }

  function startRelearn(target: RelearnTarget) {
    review.clear();
    setSheet({ kind: "relearn", target });
    setStoreFocusVerse({ book: target.book, chapter: target.chapter, verseNumber: target.startVerse });
  }

  function closeSheet() {
    setSheet(null);
    setLessonProgress(null);
    clearStoreFocusVerse();
  }

  const verseSheet = sheet?.kind === "verse" ? sheet : null;
  const tapped = verseSheet?.tappedVerse;
  const page = { pathKey, label, days, verses, version, completedDays, todaysDay };
  const { source, previewVerse, lessonDay, action, canLearnSingleVerse } = useVerseLessonSource(page, mapData, tapped, !!verseSheet && !verseSheet.lesson);
  const lessonSource = source ?? page;
  // The tapped verse stands in until the lesson reports its own, so Back never vanishes mid-lesson.
  const breadcrumbVerse = liveFocusVerse ?? tapped;
  // The drawn path's lessons — where a relearn finds the lesson its verses were learned in.
  const mapSource = mapData.status === "ready" ? mapData : page;
  const secondary = versePreviewSecondary(tapped, lessonDay, action, canLearnSingleVerse, lessonSource.version);

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
          onTapChapter={(book, chapter) => review.offerChapter(book, chapter) && setPathTarget(null)}
          focusVerse={liveFocusVerse ?? undefined}
          heightClassName={isOpen ? "h-[100dvh]" : undefined}
        />
        {!isOpen && !pathTarget && !review.offer && <MindMapCornerTools onStartReview={startReview} />}
        {!isOpen && <MindMapPathsMenu />}
      </div>
      <MindMapPathTab target={isOpen || review.offer ? null : pathTarget} onMemorize={startSetup} onClose={() => setPathTarget(null)} />
      <MindMapReviewTab offer={isOpen ? null : review.offer} onReview={startReview} onRelearn={startRelearn} onClose={review.clear} />
      <LessonBottomSheet
        open={isOpen}
        plain={sheet?.kind === "setup"}
        accentColor={breadcrumbVerse ? verseHallAccent(breadcrumbVerse.book, breadcrumbVerse.chapter) : undefined}
      >
        {sheet?.kind === "versePick" ? (
          <MindMapVerseTargetPreview target={sheet.target} version={version} onMemorize={() => startSetup(sheet.target)} />
        ) : sheet?.kind === "setup" ? (
          <MindMapPathSetup target={sheet.target} onClose={closeSheet} />
        ) : sheet?.kind === "relearn" ? (
          <InPlaceRelearnSession target={sheet.target} pathDays={mapSource.days} completedDays={mapSource.completedDays} todaysDay={mapSource.todaysDay} onExit={closeSheet} />
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
              secondary={secondary && { label: secondary.label, onClick: () => (secondary.relearn ? startRelearn(secondary.relearn) : secondary.href && router.push(secondary.href)) }}
            />
          )
        )}
      </LessonBottomSheet>
    </>
  );
}
