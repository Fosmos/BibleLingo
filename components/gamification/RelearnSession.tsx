"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { MemorizationDay, VerseSegment } from "@/types";
import { useProgressStore } from "@/store/useProgressStore";
import { ensureChapterLoaded, BibleFetchError } from "@/lib/bibleApiClient";
import { formatChapterLabel } from "@/lib/chapterContent";
import { LearnSection } from "@/components/gamification/LearnSection";
import { FetchLoading, FetchError } from "@/components/ui/FetchStatus";

interface RelearnSessionProps {
  book: string;
  chapter: number;
  verseNumber: number;
  // The last verse relearned — `verseNumber` itself for a single verse.
  endVerse: number;
  version: string;
  // Where finishing goes back to — the Memorized page, or the Mind Map it was started from.
  returnTo: string;
}

// A deliberate way to clear a verse out of the Problem Verses bin (see types/index.ts's
// ProblemVerseEntry — a later strong SRS review clears it too) — the full Learn flow
// (Rhythm, Write First Letter, Speak, Type) run again for one verse or a run of verses (the Mind
// Map's review tab offers it too — MindMapReviewTab.tsx), same stages as
// first learning it, outside of any path/day. Not wired into any path's own progress (paths,
// memorizedEntities, SRS box) at all — this only ever clears the bin entry on completion.
export function RelearnSession({ book, chapter, verseNumber, endVerse, version, returnTo }: RelearnSessionProps) {
  const router = useRouter();
  const clearProblemVerse = useProgressStore((state) => state.clearProblemVerse);
  const [verses, setVerses] = useState<VerseSegment[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    ensureChapterLoaded(book, chapter, version)
      .then((loaded) => {
        if (!cancelled) setVerses(loaded.slice(verseNumber - 1, endVerse));
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof BibleFetchError ? err.message : "Couldn't load this verse.");
      });
    return () => {
      cancelled = true;
    };
  }, [book, chapter, verseNumber, endVerse, version, retryToken]);

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

  if (!verses) {
    return <FetchLoading label="Loading…" />;
  }

  if (verses.length === 0) return <FetchError message="Couldn't find these verses." onRetry={() => router.push(returnTo)} />;
  const day: MemorizationDay = { dayNumber: 1, kind: "learn", newVerses: verses, reviewVerses: [] };

  return (
    <LearnSection
      day={day}
      // Not part of any real path (see this component's own doc comment) — this one verse is
      // its own entire "chapter" for layout purposes, always "today's" own verse (todaysDay 1
      // matches `day.dayNumber` above) so it renders with the same gold marking a real path's
      // today would.
      allDays={[day]}
      completedDays={0}
      todaysDay={1}
      label={formatChapterLabel(book, chapter)}
      version={version}
      sessionKey={`relearn:${book}|${chapter}|${verseNumber}${endVerse > verseNumber ? `-${endVerse}` : ""}`}
      onComplete={() => {
        for (const verse of verses) clearProblemVerse(book, chapter, verse.verseNumber);
        router.push(returnTo);
      }}
    />
  );
}
