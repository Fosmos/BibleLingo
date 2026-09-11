"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { MemorizationDay, VerseSegment } from "@/types";
import { useProgressStore } from "@/store/useProgressStore";
import { ensureChapterLoaded, BibleFetchError } from "@/lib/bibleApiClient";
import { LearnSection } from "@/components/gamification/LearnSection";
import { FetchLoading, FetchError } from "@/components/ui/FetchStatus";

interface RelearnSessionProps {
  book: string;
  chapter: number;
  verseNumber: number;
  version: string;
}

// A deliberate way to clear a verse out of the Problem Verses bin (see types/index.ts's
// ProblemVerseEntry — a later strong SRS review clears it too) — the full Learn flow
// (Rhythm, Write First Letter, Speak, Type) run again for just this one verse, same stages as
// first learning it, outside of any path/day. Not wired into any path's own progress (paths,
// memorizedEntities, SRS box) at all — this only ever clears the bin entry on completion.
export function RelearnSession({ book, chapter, verseNumber, version }: RelearnSessionProps) {
  const router = useRouter();
  const clearProblemVerse = useProgressStore((state) => state.clearProblemVerse);
  const [verse, setVerse] = useState<VerseSegment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    ensureChapterLoaded(book, chapter, version)
      .then((loaded) => {
        if (!cancelled) setVerse(loaded[verseNumber - 1] ?? null);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof BibleFetchError ? err.message : "Couldn't load this verse.");
      });
    return () => {
      cancelled = true;
    };
  }, [book, chapter, verseNumber, version, retryToken]);

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

  if (!verse) {
    return <FetchLoading label="Loading…" />;
  }

  const day: MemorizationDay = { dayNumber: 1, kind: "learn", newVerses: [verse], reviewVerses: [] };

  return (
    <div className="mx-auto w-full max-w-2xl p-6">
      <LearnSection
        day={day}
        sessionKey={`relearn:${book}|${chapter}|${verseNumber}`}
        onComplete={() => {
          clearProblemVerse(book, chapter, verseNumber);
          router.push("/memorized");
        }}
      />
    </div>
  );
}
