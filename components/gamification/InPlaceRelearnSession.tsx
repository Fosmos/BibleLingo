"use client";

import { useEffect, useState } from "react";
import type { MemorizationDay, VerseSegment } from "@/types";
import type { RelearnTarget } from "@/lib/relearnTarget";
import { useProgressStore } from "@/store/useProgressStore";
import { ensureChapterLoaded, BibleFetchError } from "@/lib/bibleApiClient";
import { formatChapterLabel } from "@/lib/chapterContent";
import { LearnSection } from "@/components/gamification/LearnSection";
import { FetchLoading, FetchError } from "@/components/ui/FetchStatus";
import { EsvAttribution } from "@/components/ui/EsvAttribution";

interface InPlaceRelearnSessionProps {
  target: RelearnTarget;
  // The drawn path's lessons, with its own progress — a relearn of one of them runs that very
  // lesson again (same verses, same stages, same pages) rather than a rebuilt copy.
  pathDays: MemorizationDay[];
  completedDays: number;
  todaysDay: number;
  onExit: () => void;
}

// Relearn inside the Mind Map sheet: the full Learn flow run again over verses already memorized,
// in the lesson they were first learned in — the path's own lesson when one taught exactly these
// verses, otherwise (another path's verses, a verse added by hand, "just vN") one lesson of the
// same verses. Nothing about the path or the SRS schedule changes; finishing clears the verses
// from Problem Verses and returns to the map.
export function InPlaceRelearnSession({ target, pathDays, completedDays, todaysDay, onExit }: InPlaceRelearnSessionProps) {
  const { book, chapter, startVerse, endVerse, version } = target;
  const clearProblemVerse = useProgressStore((state) => state.clearProblemVerse);
  const clearSessionCheckpoint = useProgressStore((state) => state.clearSessionCheckpoint);
  const pathDay = pathDays.find((day) => {
    const first = day.newVerses[0];
    const last = day.newVerses[day.newVerses.length - 1];
    return day.kind === "learn" && first?.book === book && first.chapter === chapter && first.verseNumber === startVerse && last.verseNumber === endVerse;
  });
  const [verses, setVerses] = useState<VerseSegment[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    if (pathDay) return;
    let cancelled = false;
    ensureChapterLoaded(book, chapter, version)
      .then((loaded) => !cancelled && setVerses(loaded.slice(startVerse - 1, endVerse)))
      .catch((err) => !cancelled && setError(err instanceof BibleFetchError ? err.message : "Couldn't load these verses."));
    return () => {
      cancelled = true;
    };
  }, [pathDay, book, chapter, startVerse, endVerse, version, retryToken]);

  const sessionKey = `relearn:${book}|${chapter}|${startVerse}-${endVerse}`;
  function finish() {
    for (let verse = startVerse; verse <= endVerse; verse++) clearProblemVerse(book, chapter, verse);
    clearSessionCheckpoint(sessionKey);
    onExit();
  }

  if (error) {
    const retry = () => {
      setError(null);
      setRetryToken((token) => token + 1);
    };
    return <FetchError message={error} onRetry={retry} />;
  }
  const standalone: MemorizationDay | null = verses && verses.length > 0 ? { dayNumber: 1, kind: "learn", newVerses: verses, reviewVerses: [] } : null;
  const day = pathDay ?? standalone;
  if (!day) return <FetchLoading label="Loading…" />;

  return (
    <>
      <LearnSection
        day={day}
        allDays={pathDay ? pathDays : [day]}
        completedDays={pathDay ? completedDays : 0}
        todaysDay={pathDay ? todaysDay : 1}
        label={formatChapterLabel(book, chapter)}
        version={version}
        sessionKey={sessionKey}
        embeddedInMindMap
        onExit={onExit}
        onComplete={finish}
      />
      <EsvAttribution visible={version === "ESV"} />
    </>
  );
}
