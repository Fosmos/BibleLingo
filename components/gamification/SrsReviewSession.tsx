"use client";

import { useEffect, useState } from "react";
import type { VerseSegment } from "@/types";
import { useProgressStore } from "@/store/useProgressStore";
import { formatChapterLabel, applyReferencePreference } from "@/lib/chapterContent";
import { ensureChapterLoaded, BibleFetchError } from "@/lib/bibleApiClient";
import { isChapterTrackedAsEsv } from "@/lib/esvCacheTracker";
import { isDue } from "@/lib/srs";
import { FirstLetterTypeRep } from "@/components/drills/FirstLetterTypeRep";
import { Button } from "@/components/ui/Button";
import { EsvAttribution } from "@/components/ui/EsvAttribution";
import { FetchLoading, FetchError } from "@/components/ui/FetchStatus";

function rangeLabel(book: string, chapter: number, startVerse: number, endVerse: number): string {
  const label = formatChapterLabel(book, chapter);
  return startVerse === endVerse ? `${label}:${startVerse}` : `${label}:${startVerse}-${endVerse}`;
}

export function SrsReviewSession() {
  const entities = useProgressStore((state) => state.memorizedEntities);
  const recordSrsReview = useProgressStore((state) => state.recordSrsReview);
  const clearSessionCheckpoint = useProgressStore((state) => state.clearSessionCheckpoint);
  const includeVerseReferences = useProgressStore((state) => state.includeVerseReferences);

  const dueEntities = entities.filter((entity) => isDue(entity.srs));
  const entity = dueEntities[0];

  // A book+chapter's cache slot holds only one translation at a time, and other browsing
  // can silently overwrite it — so this always re-fetches by the entity's own stored
  // version rather than trusting whatever's currently cached there (see
  // types/index.ts's MemorizedEntity.version). loadedForId tracks which entity the current
  // `verses` belong to, so moving to the next due entity reloads instead of reusing stale text.
  const [verses, setVerses] = useState<VerseSegment[] | null>(null);
  const [loadedForId, setLoadedForId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);

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

  if (!entity) {
    return (
      <div className="mx-auto flex w-full max-w-lg flex-col items-center gap-4 p-8 text-center">
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

  if (!verses || loadedForId !== entity.id) {
    return <FetchLoading label="Loading…" />;
  }

  const displayVerses = applyReferencePreference(verses, includeVerseReferences);
  const label = rangeLabel(entity.book, entity.chapter, entity.startVerse, entity.endVerse);
  // FirstLetterTypeRep (the same word-by-word first-letter mechanic as the Learn section)
  // takes one VerseSegment — an SRS entity can span multiple verses, so their words are
  // joined into a single synthetic segment rather than chaining separate verse components.
  const combinedVerse: VerseSegment = {
    id: entity.id,
    reference: label,
    text: displayVerses.map((verse) => verse.text).join(" "),
    book: entity.book,
    chapter: entity.chapter,
    verseNumber: entity.startVerse,
  };
  const sessionKey = `srs:${entity.id}`;

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6 p-6">
      <p className="text-caption text-ink-muted">{dueEntities.length} verse group(s) left to review</p>
      <FirstLetterTypeRep
        key={entity.id}
        verse={combinedVerse}
        reps={1}
        sessionKey={sessionKey}
        onComplete={(hadMistake) => {
          clearSessionCheckpoint(sessionKey);
          recordSrsReview(entity.id, true, !hadMistake);
        }}
      />
      <EsvAttribution visible={isChapterTrackedAsEsv(entity.book, entity.chapter)} />
    </div>
  );
}
