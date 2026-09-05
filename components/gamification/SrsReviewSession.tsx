"use client";

import { useEffect, useState } from "react";
import { RotateCcw } from "lucide-react";
import type { VerseSegment } from "@/types";
import { useProgressStore } from "@/store/useProgressStore";
import { formatVerseSpanLabel, applyReferencePreference } from "@/lib/chapterContent";
import { ensureChapterLoaded, BibleFetchError } from "@/lib/bibleApiClient";
import { isChapterTrackedAsEsv } from "@/lib/esvCacheTracker";
import { isDue, PROMOTION_ACCURACY_THRESHOLD } from "@/lib/srs";
import { verseKey } from "@/lib/verseKey";
import { useCelebration } from "@/lib/useCelebration";
import { usePericopesReady } from "@/lib/usePericopesReady";
import { getPericopeHeadingsInRange } from "@/lib/chapterPericopes";
import { PROBLEM_VERSE_ACCURACY_THRESHOLD } from "@/lib/problemVerses";
import { SrsEntityRecall } from "@/components/gamification/SrsEntityRecall";
import { SrsDueEntityPicker } from "@/components/gamification/SrsDueEntityPicker";
import { Button } from "@/components/ui/Button";
import { EsvAttribution } from "@/components/ui/EsvAttribution";
import { FetchLoading, FetchError } from "@/components/ui/FetchStatus";
import { SectionCompleteOverlay } from "@/components/ui/SectionCompleteOverlay";

export function SrsReviewSession() {
  const entities = useProgressStore((state) => state.memorizedEntities);
  const recordSrsReview = useProgressStore((state) => state.recordSrsReview);
  const clearSessionCheckpointsWithPrefix = useProgressStore((state) => state.clearSessionCheckpointsWithPrefix);
  const includeVerseReferences = useProgressStore((state) => state.includeVerseReferences);
  const srsBestAccuracy = useProgressStore((state) => state.srsBestAccuracy);
  const versePOA = useProgressStore((state) => state.versePOA);
  const pericopeHeadingRecallEnabled = useProgressStore((state) => state.pericopeHeadingRecallEnabled);
  const flagProblemVerse = useProgressStore((state) => state.flagProblemVerse);
  const clearProblemVerse = useProgressStore((state) => state.clearProblemVerse);
  // The reader's own configured thresholds (Profile > Settings) — undefined (a profile
  // saved before these existed) falls back to the same defaults lib/srs.ts and
  // lib/problemVerses.ts have always used.
  const promotionThreshold = useProgressStore((state) => state.srsPromotionThreshold) ?? PROMOTION_ACCURACY_THRESHOLD;
  const problemVerseThreshold = useProgressStore((state) => state.problemVerseThreshold) ?? PROBLEM_VERSE_ACCURACY_THRESHOLD;
  const { pending, celebrate, finish } = useCelebration();

  const dueEntities = entities.filter((entity) => isDue(entity.srs));
  // Lets the reader jump to a specific due verse group instead of always the first one —
  // falls back to the first whenever the picked one isn't (or is no longer, e.g. it was just
  // reviewed and dropped out of dueEntities) due, so finishing one naturally advances to
  // whatever's next without any extra state to reset.
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const entity = dueEntities.find((candidate) => candidate.id === selectedEntityId) ?? dueEntities[0];

  // A book+chapter's cache slot holds only one translation at a time, and other browsing
  // can silently overwrite it — so this always re-fetches by the entity's own stored
  // version rather than trusting whatever's currently cached there (see
  // types/index.ts's MemorizedEntity.version). loadedForId tracks which entity the current
  // `verses` belong to, so moving to the next due entity reloads instead of reusing stale text.
  const [verses, setVerses] = useState<VerseSegment[] | null>(null);
  const [loadedForId, setLoadedForId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);
  // Bumped to force FirstLetterTypeRep to remount (see its key below), discarding all its
  // in-progress typing state — paired with clearing its session checkpoint so the fresh mount
  // starts over from word 1 instead of resuming from where the checkpoint left off.
  const [restartToken, setRestartToken] = useState(0);
  // Waits for section-heading data before deciding whether this entity opens a new pericope
  // (see the pericopeHeading computation below) — called unconditionally, alongside every
  // other hook here, since hooks can't be called after an early return.
  const pericopesReady = usePericopesReady(verses);

  useEffect(() => {
    if (!entity || loadedForId === entity.id) return;
    let cancelled = false;
    ensureChapterLoaded(entity.book, entity.chapter, entity.version)
      .then((loaded) => {
        if (cancelled) return;
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
  const bestAccuracy = srsBestAccuracy[entity.id];
  // Only a genuinely one-verse entity has one Visualize POA to recall — a merged range spans
  // multiple verses' worth of scenes, none of which alone represents the whole review.
  const entityPOA = entity.startVerse === entity.endVerse ? versePOA[verseKey(entity.book, entity.chapter, entity.startVerse)] : undefined;
  // Every pericope this entity's range opens (not just one at its very start) — see
  // SrsEntityRecall.tsx for how each gates its own blind type-the-heading pass ahead of the
  // verse recall.
  const pericopeHeadings = pericopeHeadingRecallEnabled
    ? getPericopeHeadingsInRange(entity.book, entity.chapter, entity.startVerse, entity.endVerse)
    : [];

  function restart() {
    // Each pericope-heading segment checkpoints under its own "sessionKey:stepIndex"
    // sub-key (see SrsEntityRecall.tsx) — a plain clearSessionCheckpoint(sessionKey) only
    // ever clears the bare key, leaving whichever segment was in progress resuming right
    // back where it left off instead of genuinely restarting from word 1.
    clearSessionCheckpointsWithPrefix(sessionKey);
    setRestartToken((token) => token + 1);
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-6">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-caption text-ink-muted">{dueEntities.length} verse group(s) left to review</p>
          {bestAccuracy !== undefined && (
            <p className="text-caption text-ink-muted">
              Best score for {label}: <span className="font-semibold text-brand-600 dark:text-brand-400">{bestAccuracy}%</span>
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={restart}
          className="flex items-center gap-1 rounded-full bg-mist px-3 py-1.5 text-xs font-medium text-ink-soft hover:bg-line dark:bg-zinc-800 dark:text-zinc-300"
        >
          <RotateCcw size={13} /> Restart
        </button>
      </div>
      <SrsDueEntityPicker dueEntities={dueEntities} currentEntityId={entity.id} onSelect={setSelectedEntityId} />
      <SrsEntityRecall
        key={`${entity.id}-${restartToken}`}
        verses={displayVerses}
        sessionKey={sessionKey}
        label={label}
        pericopeHeadings={pericopeHeadings}
        entityPOA={entityPOA}
        onRestart={restart}
        onVerseAccuracy={(results) => {
          results.forEach(({ verseNumber, accuracy: verseAccuracy }) => {
            if (verseAccuracy < problemVerseThreshold) {
              flagProblemVerse(entity.book, entity.chapter, verseNumber, entity.version);
            } else if (verseAccuracy >= promotionThreshold) {
              // A later good review DOES clear a verse out of the bin now — the only other
              // way out is fully relearning it (see RelearnSession.tsx).
              clearProblemVerse(entity.book, entity.chapter, verseNumber);
            }
          });
        }}
        onComplete={(accuracy) => {
          celebrate(() => {
            clearSessionCheckpointsWithPrefix(sessionKey);
            recordSrsReview(entity.id, accuracy);
          }, `${accuracy}% correct`);
        }}
      />
      <EsvAttribution visible={isChapterTrackedAsEsv(entity.book, entity.chapter)} />
    </div>
  );
}
