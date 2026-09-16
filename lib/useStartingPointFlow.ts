"use client";

import { useState } from "react";
import type { BibleBook, LocationTagLevel } from "@/types";
import { ensureChapterLoaded, BibleFetchError } from "@/lib/bibleApiClient";
import { mapWithConcurrency } from "@/lib/fetchWithConcurrency";
import { priorKnownVerseCountThrough } from "@/lib/dayPlan";

// Held between "how far along are you" (see StartingPointFlow.tsx) and the actual navigation
// — every argument goToPath would otherwise have received right away, now deferred until that
// extra step resolves (either "start fresh," immediately, or "here's my starting verse," once
// it's turned into a starting day).
interface PendingFinish {
  identifier: string;
  kind: "book" | "chapter";
  version: string;
  versesPerDay?: number;
  locationTagLevels?: LocationTagLevel[];
  sectionEndPegEnabled?: boolean;
}

type GoToPath = (
  identifier: string,
  kind: "book" | "chapter" | "verse",
  version: string,
  versesPerDay?: number,
  locationTagLevels?: LocationTagLevel[],
  sectionEndPegEnabled?: boolean,
  priorKnownVerseCount?: number,
) => void;

interface UseStartingPointFlowArgs {
  selectedBook: BibleBook | null;
  goToPath: GoToPath;
  onLoading: (label: string) => void;
  onError: (message: string) => void;
  onIdle: () => void;
}

const CHAPTER_FETCH_CONCURRENCY = 4;

// GuidedPathFlow.tsx's own last step for book/chapter mode, split out purely to keep that
// file under this codebase's 200-line cap — see StartingPointFlow.tsx for the UI this drives,
// and lib/dayPlan.ts's priorKnownVerseCountThrough for how a picked (chapter, verseNumber)
// turns into an actual starting point. Async status is reported back through the three callbacks
// rather than owned here, so GuidedPathFlow.tsx's existing status/loadingLabel/errorMessage
// state stays the single source of truth every OTHER step in that flow already uses.
export function useStartingPointFlow({ selectedBook, goToPath, onLoading, onError, onIdle }: UseStartingPointFlowArgs) {
  const [pendingFinish, setPendingFinish] = useState<PendingFinish | null>(null);

  // Passed to useLearnIntensityFlow in place of goToPath — book/chapter mode's own chain ends
  // here instead of navigating right away, so StartingPointFlow.tsx gets a chance to ask
  // "already know some of this?" first. Matches goToPath's own (pre-priorKnownVerseCount)
  // signature exactly, since intensityFlow never knows a starting point itself. Verse mode's own
  // handleSelectVerse (GuidedPathFlow.tsx) calls goToPath directly instead — a single verse
  // has nothing to "already know part of."
  function requestFinish(
    identifier: string,
    kind: "book" | "chapter" | "verse",
    version: string,
    versesPerDay?: number,
    locationTagLevels?: LocationTagLevel[],
    sectionEndPegEnabled?: boolean,
  ) {
    setPendingFinish({ identifier, kind: kind as "book" | "chapter", version, versesPerDay, locationTagLevels, sectionEndPegEnabled });
  }

  function finishFromBeginning() {
    if (!pendingFinish) return;
    goToPath(
      pendingFinish.identifier,
      pendingFinish.kind,
      pendingFinish.version,
      pendingFinish.versesPerDay,
      pendingFinish.locationTagLevels,
      pendingFinish.sectionEndPegEnabled,
    );
  }

  // Turns "I've memorized through book X, chapter/verse Y" into an exact prior-known-verse
  // count — needs this path's own real verses (the same flat array lib/dayPlan.ts's
  // buildDayPlan/buildBookDayPlan will later chunk against) to find that verse's own array
  // position.
  async function handleStartingPointPicked(chapter: number, verseNumber: number) {
    if (!pendingFinish || !selectedBook) return;
    onLoading("Finding where to start…");
    try {
      const verses =
        pendingFinish.kind === "book"
          ? (
              await mapWithConcurrency(
                Array.from({ length: selectedBook.chapterCount }, (_, index) => index + 1),
                CHAPTER_FETCH_CONCURRENCY,
                (chapterNumber) => ensureChapterLoaded(selectedBook.name, chapterNumber, pendingFinish.version),
              )
            ).flat()
          : await ensureChapterLoaded(selectedBook.name, chapter, pendingFinish.version);
      const priorKnownVerseCount = priorKnownVerseCountThrough(verses, chapter, verseNumber);
      onIdle();
      goToPath(
        pendingFinish.identifier,
        pendingFinish.kind,
        pendingFinish.version,
        pendingFinish.versesPerDay,
        pendingFinish.locationTagLevels,
        pendingFinish.sectionEndPegEnabled,
        priorKnownVerseCount,
      );
    } catch (error) {
      onError(error instanceof BibleFetchError ? error.message : "Something went wrong figuring out where to start.");
    }
  }

  return {
    pendingFinish,
    requestFinish,
    finishFromBeginning,
    handleStartingPointPicked,
    clearPendingFinish: () => setPendingFinish(null),
  };
}
