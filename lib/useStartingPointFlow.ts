"use client";

import { useState } from "react";
import type { BibleBook, LocationTagLevel } from "@/types";
import { ensureChapterLoaded, BibleFetchError } from "@/lib/bibleApiClient";
import { mapWithConcurrency } from "@/lib/fetchWithConcurrency";
import { pathKey } from "@/lib/memorizationContent";
import { buildPathDayPlan, completedDaysThroughVerse } from "@/lib/dayPlan";

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
}

type GoToPath = (
  identifier: string,
  kind: "book" | "chapter" | "verse",
  version: string,
  versesPerDay?: number,
  locationTagLevels?: LocationTagLevel[],
  startAtCompletedDays?: number,
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
// and lib/dayPlan.ts's completedDaysThroughVerse for how a picked (chapter, verseNumber) turns
// into an actual starting day. Async status is reported back through the three callbacks
// rather than owned here, so GuidedPathFlow.tsx's existing status/loadingLabel/errorMessage
// state stays the single source of truth every OTHER step in that flow already uses.
export function useStartingPointFlow({ selectedBook, goToPath, onLoading, onError, onIdle }: UseStartingPointFlowArgs) {
  const [pendingFinish, setPendingFinish] = useState<PendingFinish | null>(null);

  // Passed in place of goToPath wherever GuidedPathFlow.tsx would otherwise finish a book/
  // chapter pick right away — that finish now waits for StartingPointFlow.tsx to ask "already
  // know some of this?" first. Verse mode's own handleSelectVerse calls goToPath directly
  // instead — a single verse has nothing to "already know part of."
  function requestFinish(
    identifier: string,
    kind: "book" | "chapter" | "verse",
    version: string,
    versesPerDay?: number,
    locationTagLevels?: LocationTagLevel[],
  ) {
    setPendingFinish({ identifier, kind: kind as "book" | "chapter", version, versesPerDay, locationTagLevels });
  }

  function finishFromBeginning() {
    if (!pendingFinish) return;
    goToPath(pendingFinish.identifier, pendingFinish.kind, pendingFinish.version, pendingFinish.versesPerDay, pendingFinish.locationTagLevels);
  }

  // Turns "I've memorized through book X, chapter/verse Y" into an actual starting day —
  // needs this path's own real verses and day-plan shape (versesPerDay, chunking), the exact
  // same inputs PathOverviewScreen.tsx would use once the path actually exists, just computed
  // a step early.
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
      const key = pathKey(pendingFinish.kind, pendingFinish.identifier);
      const days = buildPathDayPlan(key, verses, {
        version: pendingFinish.version,
        completedDays: 0,
        lastCompletedAt: null,
        versesPerDay: pendingFinish.versesPerDay,
      });
      const startAtCompletedDays = completedDaysThroughVerse(days, chapter, verseNumber);
      onIdle();
      goToPath(
        pendingFinish.identifier,
        pendingFinish.kind,
        pendingFinish.version,
        pendingFinish.versesPerDay,
        pendingFinish.locationTagLevels,
        startAtCompletedDays,
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
