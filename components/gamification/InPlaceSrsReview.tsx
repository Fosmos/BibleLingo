"use client";

import { useCallback, useEffect, useState } from "react";
import type { VerseSegment } from "@/types";
import { useProgressStore } from "@/store/useProgressStore";
import { useLessonSessionStore } from "@/store/useLessonSessionStore";
import { applyReferencePreference, formatVerseSpanLabel } from "@/lib/chapterContent";
import { ensureChapterLoaded, BibleFetchError } from "@/lib/bibleApiClient";
import { useCelebration } from "@/lib/useCelebration";
import { useEmbeddedSenseCardOverride } from "@/lib/useEmbeddedSenseCardOverride";
import { useReportFocusVerse } from "@/lib/useReportFocusVerse";
import { useSrsReviewRun } from "@/lib/useSrsReviewRun";
import type { ReviewChainProgress } from "@/lib/useReviewChain";
import { useWholeChapterReadingLayout } from "@/lib/useWholeChapterReadingLayout";
import { ReviewChain } from "@/components/drills/ReviewChain";
import { FirstLetterSpeakRep } from "@/components/drills/FirstLetterSpeakRep";
import { SrsInputModeToggle } from "@/components/gamification/SrsInputModeToggle";
import { joinVerses, verseNumberMarkers } from "@/lib/verseBatching";
import { LessonChrome } from "@/components/gamification/LessonChrome";
import { FetchLoading, FetchError } from "@/components/ui/FetchStatus";
import { SectionCompleteOverlay } from "@/components/ui/SectionCompleteOverlay";

interface InPlaceSrsReviewProps {
  // The due ranges to walk through, in order — snapshotted when the run starts (see
  // BookMindMapWithLessonSheet.tsx), so one dropping out of "due" once reviewed doesn't reshuffle
  // the rest mid-run.
  entityIds: string[];
  onExit: () => void;
}

// SRS review inside the Mind Map sheet, run exactly like a lesson's Previous Verses / Chapter
// Review stages (see ReviewSection.tsx): each due range is typed by first letter (or spoken aloud) through
// ReviewChain on its own real chapter page, the canvas above following verse to verse (and
// flying on to the next range's chapter — see lib/useMindMapFollowFocusBranch.ts). Each range's
// score reschedules it (store/srsReviewActions.ts's recordSrsReview, which also keeps it as the
// node's "last review %"); after the last one the sheet closes back to the map.
export function InPlaceSrsReview({ entityIds, onExit }: InPlaceSrsReviewProps) {
  const entities = useProgressStore((state) => state.memorizedEntities);
  const recordSrsReview = useProgressStore((state) => state.recordSrsReview);
  const includeVerseReferences = useProgressStore((state) => state.includeVerseReferences);
  const speakMode = useProgressStore((state) => state.srsSpeakModeEnabled);
  const setLessonProgress = useLessonSessionStore((state) => state.setLessonProgress);
  const reportVerse = useReportFocusVerse(true);
  const { pending, celebrate, finish } = useCelebration();
  // How far through `entityIds` the run is. A range that vanished since the run started
  // (re-synced away) is simply stepped over: `current` is the first one still there from here on.
  // Saved as it goes, so leaving part-way can be picked up later (lib/useSrsReviewRun.ts).
  const run = useSrsReviewRun(entityIds);
  const [index, setIndex] = useState(run.startIndex);
  const current = entityIds.findIndex((id, position) => position >= index && entities.some((candidate) => candidate.id === id));
  const entity = current === -1 ? undefined : entities.find((candidate) => candidate.id === entityIds[current]);
  const { saveIndex, saveProgress, finish: finishRun } = run;
  const onProgress = useCallback((progress: ReviewChainProgress) => saveProgress(current, progress), [current, saveProgress]);
  useEffect(() => {
    if (current !== -1) saveIndex(current);
  }, [current, saveIndex]);

  const [chapterVerses, setChapterVerses] = useState<VerseSegment[]>([]);
  const [loadedForId, setLoadedForId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);
  const [fillHeightPx, columnWidthPx] = useEmbeddedSenseCardOverride(true);
  const layout = useWholeChapterReadingLayout(chapterVerses, fillHeightPx, columnWidthPx);

  useEffect(() => {
    setLessonProgress(entityIds.length > 0 ? Math.max(0, current) / entityIds.length : null);
  }, [current, entityIds.length, setLessonProgress]);

  // A book+chapter's cache slot holds one translation at a time, so this always fetches by the
  // range's own stored version (see MemorizedEntity.version) — same as SrsReviewSession.tsx.
  useEffect(() => {
    if (!entity || loadedForId === entity.id) return;
    let cancelled = false;
    ensureChapterLoaded(entity.book, entity.chapter, entity.version)
      .then((loaded) => {
        if (cancelled) return;
        setChapterVerses(loaded);
        setLoadedForId(entity.id);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof BibleFetchError ? err.message : "Couldn't load this verse.");
      });
    return () => {
      cancelled = true;
    };
  }, [entity, loadedForId, retryToken]);

  // Nothing (left) to review — straight back to the map.
  useEffect(() => {
    if (entity || pending) return;
    finishRun();
    onExit();
  }, [entity, pending, onExit, finishRun]);

  if (pending) return <SectionCompleteOverlay text={pending.text} onDone={finish} />;
  if (!entity) return null;
  if (error) {
    const retry = () => {
      setError(null);
      setRetryToken((token) => token + 1);
    };
    return <FetchError message={error} onRetry={retry} />;
  }
  if (loadedForId !== entity.id) return <FetchLoading label="Loading…" />;

  const verses = applyReferencePreference(chapterVerses.slice(entity.startVerse - 1, entity.endVerse), includeVerseReferences);
  const label = formatVerseSpanLabel(entity.book, entity.chapter, entity.startVerse, entity.endVerse);

  function handleComplete(accuracy: number) {
    if (!entity) return;
    recordSrsReview(entity.id, accuracy);
    const isLast = current + 1 >= entityIds.length;
    if (isLast) finishRun();
    else saveIndex(current + 1);
    celebrate(isLast ? onExit : () => setIndex(current + 1), `${label} reviewed`);
  }

  return (
    <>
      <LessonChrome label={label} version={entity.version} current={current + 1} total={entityIds.length} onExit={onExit} layout={layout} embeddedInMindMap />
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-3 px-4 pt-3">
        {/* Typed by first letter, or spoken aloud — the reader's choice (SrsInputModeToggle.tsx). */}
        {speakMode ? (
          <FirstLetterSpeakRep
            key={`speak-${entity.id}`}
            verse={joinVerses(verses, "entity")}
            verses={verses}
            layout={layout}
            verseMarkers={verseNumberMarkers(verses)}
            onComplete={(_hadMistake, accuracy) => handleComplete(accuracy)}
            onVerseChange={reportVerse}
            verseViewExtra={<SrsInputModeToggle />}
          />
        ) : (
          <ReviewChain
            key={entity.id}
            label={`Review ${label}`}
            verses={verses}
            onComplete={handleComplete}
            layout={layout}
            restartOnMistake={false}
            onVerseChange={reportVerse}
            verseViewExtra={<SrsInputModeToggle />}
            initialProgress={run.progressFor(current)}
            onProgress={onProgress}
          />
        )}
      </div>
    </>
  );
}
