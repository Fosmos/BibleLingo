"use client";

import { useState } from "react";
import type { BibleBook } from "@/types";
import { formatChapterLabel } from "@/lib/chapterContent";
import { ensureChapterLoaded, BibleFetchError } from "@/lib/bibleApiClient";
import { mapWithConcurrency } from "@/lib/fetchWithConcurrency";
import { useGoToPath } from "@/lib/useGoToPath";
import { useLearnIntensityFlow } from "@/lib/useLearnIntensityFlow";
import { useStartingPointFlow } from "@/lib/useStartingPointFlow";
import { VersionPicker } from "@/components/gamification/VersionPicker";
import { VersesPerDayPicker } from "@/components/gamification/VersesPerDayPicker";
import { LearnIntensityPicker } from "@/components/gamification/LearnIntensityPicker";
import { StartingPointFlow } from "@/components/gamification/StartingPointFlow";
import { FetchLoading, FetchError } from "@/components/ui/FetchStatus";

interface GuidedPathFlowProps {
  mode: "book" | "chapter" | "verse";
  onBack: () => void;
  // The book/chapter/verse, already chosen by navigating the Mind Map (see MindMapPathSetup.tsx)
  // — this flow runs just the steps after it, starting at the translation; backing out of that
  // first step leaves the flow. `chapter` is set for chapter/verse mode, `verse` for verse mode.
  preset: { book: BibleBook; chapter?: number; verse?: number };
}

const CHAPTER_FETCH_CONCURRENCY = 4;

export function GuidedPathFlow({ mode, onBack, preset }: GuidedPathFlowProps) {
  const goToPath = useGoToPath();
  const selectedBook = preset.book;
  const selectedChapter = preset.chapter ?? null;
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
  const [verseCount, setVerseCount] = useState<number | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [loadingLabel, setLoadingLabel] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Book/chapter mode's own last step before goToPath — "already know some of this?" — see
  // lib/useStartingPointFlow.ts.
  const startingPointFlow = useStartingPointFlow({
    selectedBook,
    goToPath,
    onLoading: (label) => {
      setStatus("loading");
      setLoadingLabel(label);
      setErrorMessage("");
    },
    onError: (message) => {
      setStatus("error");
      setErrorMessage(message);
    },
    onIdle: () => setStatus("idle"),
  });

  // Book/chapter mode's step chain after "how many verses per day" — see
  // lib/useLearnIntensityFlow.ts. goToPath here is startingPointFlow.requestFinish, not real navigation.
  const intensityFlow = useLearnIntensityFlow({ mode, selectedBook, selectedChapter, selectedVersion, goToPath: startingPointFlow.requestFinish });

  async function handleSelectVersion(version: string) {
    setStatus("loading");
    setErrorMessage("");

    try {
      if (mode === "book") {
        const chapters = Array.from({ length: selectedBook.chapterCount }, (_, index) => index + 1);
        const chapterVerses = await mapWithConcurrency(chapters, CHAPTER_FETCH_CONCURRENCY, (chapter) => {
          setLoadingLabel(`Loading ${selectedBook.name} ${chapter} of ${selectedBook.chapterCount}…`);
          return ensureChapterLoaded(selectedBook.name, chapter, version);
        });
        // Stay on this flow to ask how many verses/day now that the total is known.
        setSelectedVersion(version);
        setVerseCount(chapterVerses.reduce((sum, verses) => sum + verses.length, 0));
        setStatus("idle");
        return;
      }

      if (!selectedChapter) return;
      setLoadingLabel(`Loading ${formatChapterLabel(selectedBook.name, selectedChapter)}…`);
      const verses = await ensureChapterLoaded(selectedBook.name, selectedChapter, version);
      if (mode === "verse" && preset.verse) {
        goToPath(`${selectedBook.name}|${selectedChapter}|${preset.verse}`, "verse", version);
        return;
      }

      // Chapter mode stays on this flow to ask how many verses/day (like book mode); verse
      // mode stays on it to show the verse grid for the now-loaded chapter.
      setSelectedVersion(version);
      setVerseCount(verses.length);
      setStatus("idle");
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof BibleFetchError ? error.message : "Something went wrong loading that content.");
    }
  }

  if (status === "loading") {
    return <FetchLoading label={loadingLabel} />;
  }

  if (status === "error") {
    return <FetchError message={errorMessage} onRetry={() => setStatus("idle")} />;
  }

  if (startingPointFlow.pendingFinish) {
    const pendingFinish = startingPointFlow.pendingFinish;
    return (
      <StartingPointFlow
        book={selectedBook}
        kind={pendingFinish.kind}
        fixedChapter={pendingFinish.kind === "chapter" ? (selectedChapter ?? undefined) : undefined}
        fixedChapterVerseCount={pendingFinish.kind === "chapter" ? (verseCount ?? undefined) : undefined}
        version={pendingFinish.version}
        onStartFromBeginning={startingPointFlow.finishFromBeginning}
        onPickStartingPoint={startingPointFlow.handleStartingPointPicked}
        onBack={startingPointFlow.clearPendingFinish}
      />
    );
  }

  if (intensityFlow.pendingVersesPerDay !== null) {
    return (
      <LearnIntensityPicker
        initialStages={intensityFlow.initialStages}
        initialMemoryPalace={intensityFlow.initialMemoryPalace}
        onContinue={intensityFlow.handleIntensityContinue}
        onBack={intensityFlow.resetPendingVersesPerDay}
      />
    );
  }

  if (verseCount !== null && (mode === "book" || (mode === "chapter" && selectedChapter))) {
    const description =
      mode === "chapter" ? "each lesson reviews everything learned so far in this chapter, then learns this many new verses." : undefined;
    return (
      <VersesPerDayPicker
        totalVerses={verseCount}
        description={description}
        onSelect={intensityFlow.handleSelectVersesPerDay}
        onBack={() => {
          setVerseCount(null);
          setSelectedVersion(null);
        }}
      />
    );
  }

  if (mode === "book" || selectedChapter) {
    const title = mode === "book" ? selectedBook.name : formatChapterLabel(selectedBook.name, selectedChapter as number);
    return (
      <VersionPicker title={title} onSelectVersion={handleSelectVersion} onBack={onBack} />
    );
  }

  return null;
}
