"use client";

import { useEffect, useState } from "react";
import type { VerseSegment } from "@/types";
import type { VerseAccuracy } from "@/lib/verseAccuracyBreakdown";
import { useProgressStore } from "@/store/useProgressStore";
import { formatVerseSpanLabel, applyReferencePreference } from "@/lib/chapterContent";
import { ensureChapterLoaded, BibleFetchError } from "@/lib/bibleApiClient";
import { isChapterTrackedAsEsv } from "@/lib/esvCacheTracker";
import { isDue, PROMOTION_ACCURACY_THRESHOLD } from "@/lib/srs";
import { verseKey } from "@/lib/verseKey";
import { useCelebration } from "@/lib/useCelebration";
import { usePericopesReady } from "@/lib/usePericopesReady";
import { useWholeChapterReadingLayout } from "@/lib/useWholeChapterReadingLayout";
import { SrsEntityRecall } from "@/components/gamification/SrsEntityRecall";
import { SrsReviewTopBar } from "@/components/gamification/SrsReviewTopBar";
import { ChapterFitProbes } from "@/components/gamification/ChapterFitProbes";
import { Button } from "@/components/ui/Button";
import { EsvAttribution } from "@/components/ui/EsvAttribution";
import { FetchLoading, FetchError } from "@/components/ui/FetchStatus";
import { SectionCompleteOverlay } from "@/components/ui/SectionCompleteOverlay";

export function SrsReviewSession() {
  const entities = useProgressStore((state) => state.memorizedEntities);
  const recordSrsReview = useProgressStore((state) => state.recordSrsReview);
  const clearSessionCheckpointsWithPrefix = useProgressStore((state) => state.clearSessionCheckpointsWithPrefix);
  const sessionCheckpoints = useProgressStore((state) => state.sessionCheckpoints);
  const includeVerseReferences = useProgressStore((state) => state.includeVerseReferences);
  const versePOA = useProgressStore((state) => state.versePOA);
  const flagProblemVerse = useProgressStore((state) => state.flagProblemVerse);
  const clearProblemVerse = useProgressStore((state) => state.clearProblemVerse);
  const recordWordStumbles = useProgressStore((state) => state.recordWordStumbles);
  // The reader's own configured promotion threshold (Profile > Settings) — undefined (a
  // profile saved before this existed) falls back to lib/srs.ts's own longstanding default.
  const promotionThreshold = useProgressStore((state) => state.srsPromotionThreshold) ?? PROMOTION_ACCURACY_THRESHOLD;
  const { pending, celebrate, finish } = useCelebration();

  const dueEntities = entities.filter((entity) => isDue(entity.srs));
  // Lets the reader jump to a specific due verse group instead of always the first one —
  // falls back to the first whenever the picked one isn't (or is no longer, e.g. it was just
  // reviewed and dropped out of dueEntities) due, so finishing one naturally advances to
  // whatever's next without any extra state to reset.
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  // A reload clears selectedEntityId (plain useState), but FirstLetterTypeRep's own wordIndex
  // checkpoint for whichever entity was being typed survives (persisted — see sessionCheckpoints
  // / lib/useFirstLetterTyping.ts), so prefer that entity over "just the first due one" so a
  // reload resumes the SAME review.
  const inProgressEntity = dueEntities.find((candidate) => sessionCheckpoints[`srs:${candidate.id}`]?.wordIndex !== undefined);
  const entity = dueEntities.find((candidate) => candidate.id === selectedEntityId) ?? inProgressEntity ?? dueEntities[0];

  // A book+chapter's cache slot holds only one translation at a time, and other browsing
  // can silently overwrite it — so this always re-fetches by the entity's own stored
  // version rather than trusting whatever's currently cached there (see
  // types/index.ts's MemorizedEntity.version). loadedForId tracks which entity the current
  // `verses`/`chapterVerses` belong to, so moving to the next due entity reloads instead of
  // reusing stale text. `chapterVerses` (the WHOLE chapter, unsliced) feeds
  // useWholeChapterReadingLayout below so this entity's own real page(s) match the reading
  // view exactly — see that hook's own doc comment on why pagination needs the full chapter,
  // never just this entity's own slice of it.
  const [verses, setVerses] = useState<VerseSegment[] | null>(null);
  const [chapterVerses, setChapterVerses] = useState<VerseSegment[]>([]);
  const [loadedForId, setLoadedForId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);
  // Bumped to force FirstLetterTypeRep to remount (see its key below), discarding all its
  // in-progress typing state — paired with clearing its session checkpoint so the fresh mount
  // starts over from word 1 instead of resuming from where the checkpoint left off.
  const [restartToken, setRestartToken] = useState(0);
  // Waits for section-heading data before this entity's own real page(s) render (a pericope
  // heading resolving a beat after the page itself would otherwise shift the page's own
  // height/pagination underneath the reader) — called unconditionally, alongside every other
  // hook here, since hooks can't be called after an early return.
  const pericopesReady = usePericopesReady(verses);
  const layout = useWholeChapterReadingLayout(chapterVerses);

  useEffect(() => {
    if (!entity || loadedForId === entity.id) return;
    let cancelled = false;
    ensureChapterLoaded(entity.book, entity.chapter, entity.version)
      .then((loaded) => {
        if (cancelled) return;
        setChapterVerses(loaded);
        setVerses(loaded.slice(entity.startVerse - 1, entity.endVerse));
        setLoadedForId(entity.id);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof BibleFetchError ? err.message : "Couldn't load this verse.");
      });
    return () => {
      cancelled = true;
    };
  }, [entity, loadedForId, retryToken]);

  if (pending) {
    return <SectionCompleteOverlay text={pending.text} onDone={finish} />;
  }

  if (!entity) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-4 p-8 text-center">
        <h1 className="text-title text-brand-600">All caught up!</h1>
        <p className="text-ink-muted">No verse groups are due for review right now.</p>
        <Button href="/memorized">Back to Memorized Verses</Button>
      </div>
    );
  }

  if (error) {
    return (
      <FetchError
        message={error}
        onRetry={() => {
          setError(null);
          setRetryToken((token) => token + 1);
        }}
      />
    );
  }

  if (!verses || loadedForId !== entity.id || !pericopesReady) {
    return <FetchLoading label="Loading…" />;
  }

  const displayVerses = applyReferencePreference(verses, includeVerseReferences);
  const label = formatVerseSpanLabel(entity.book, entity.chapter, entity.startVerse, entity.endVerse);
  const sessionKey = `srs:${entity.id}`;
  // Only a genuinely one-verse entity has one Visualize POA to recall — a merged range spans
  // multiple verses' worth of scenes, none of which alone represents the whole review.
  const entityPOA = entity.startVerse === entity.endVerse ? versePOA[verseKey(entity.book, entity.chapter, entity.startVerse)] : undefined;
  const { bodyTopRef, probeContainerRef, pages, fillHeightPx, dayNumberByVerse, todaysVerseNumbers, completedDays, locationTags, iconTags, pegActive } = layout;

  function restart() {
    clearSessionCheckpointsWithPrefix(sessionKey);
    setRestartToken((token) => token + 1);
  }

  function handleVerseAccuracy(results: VerseAccuracy[]) {
    results.forEach(({ verseNumber, accuracy: verseAccuracy, wrongIndices, neededHint }) => {
      // Problem Verses gates on neededHint specifically — a verse the reader had to explicitly
      // ask to reveal, not just one mistyped and self-corrected (see VerseAccuracy.neededHint).
      // Promotion out of the bin still uses the usual accuracy threshold — a later clean review
      // clears it, same as before.
      if (neededHint) flagProblemVerse(entity.book, entity.chapter, verseNumber, entity.version);
      else if (verseAccuracy >= promotionThreshold) clearProblemVerse(entity.book, entity.chapter, verseNumber);
      const verse = displayVerses.find((candidate) => candidate.verseNumber === verseNumber);
      if (verse) recordWordStumbles(verse, wrongIndices);
    });
  }

  return (
    // Pixel-identical to the reading view / Learn flow: SrsReviewTopBar renders at LessonTopBar's
    // exact height, then `bodyTopRef` + fit probes as bare siblings, then the drill's own tight
    // column — so bodyTopRef lands at the same Y and useChapterReadingLayout returns the identical
    // pages/font-size/card. EsvAttribution is the final sibling, matching DayLoader.tsx.
    <>
      <SrsReviewTopBar
        label={label}
        version={entity.version}
        dueEntities={dueEntities}
        currentEntityId={entity.id}
        onSelect={setSelectedEntityId}
        onRestart={restart}
      />
      <div ref={bodyTopRef} />
      <div className="mx-auto w-full max-w-2xl px-4">
        <ChapterFitProbes
          ref={probeContainerRef}
          pages={pages}
          fillHeightPx={fillHeightPx}
          dayNumberByVerse={dayNumberByVerse}
          todaysVerseNumbers={todaysVerseNumbers}
          completedDays={completedDays}
          locationTags={locationTags}
          iconTags={iconTags}
          pegActive={pegActive}
        />
      </div>
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-3 px-4 pt-3">
        <SrsEntityRecall
          key={`${entity.id}-${restartToken}`}
          verses={displayVerses}
          sessionKey={sessionKey}
          label={label}
          layout={layout}
          entityPOA={entityPOA}
          onRestart={restart}
          onVerseAccuracy={handleVerseAccuracy}
          onComplete={(accuracy) => {
            celebrate(() => {
              clearSessionCheckpointsWithPrefix(sessionKey);
              recordSrsReview(entity.id, accuracy);
            }, `${accuracy}% correct`);
          }}
        />
      </div>
      <EsvAttribution visible={isChapterTrackedAsEsv(entity.book, entity.chapter)} />
    </>
  );
}
