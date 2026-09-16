"use client";

import { useState } from "react";
import type { BibleBook } from "@/types";
import { BIBLE_BOOKS } from "@/lib/bibleBooks";
import { formatChapterLabel } from "@/lib/chapterContent";
import { ensureChapterLoaded, BibleFetchError } from "@/lib/bibleApiClient";
import { mapWithConcurrency } from "@/lib/fetchWithConcurrency";
import { useGoToPath } from "@/lib/useGoToPath";
import { useLearnIntensityFlow } from "@/lib/useLearnIntensityFlow";
import { useStartingPointFlow } from "@/lib/useStartingPointFlow";
import { BookList } from "@/components/gamification/BookList";
import { ChapterGrid } from "@/components/gamification/ChapterGrid";
import { VersionPicker } from "@/components/gamification/VersionPicker";
import { VersePicker } from "@/components/gamification/VersePicker";
import { VersesPerDayPicker } from "@/components/gamification/VersesPerDayPicker";
import { LearnIntensityPicker } from "@/components/gamification/LearnIntensityPicker";
import { LocationTagLevelPicker } from "@/components/gamification/LocationTagLevelPicker";
import { StartingPointFlow } from "@/components/gamification/StartingPointFlow";
import { FetchLoading, FetchError } from "@/components/ui/FetchStatus";

interface GuidedPathFlowProps {
  mode: "book" | "chapter" | "verse";
  onBack: () => void;
}

const CHAPTER_FETCH_CONCURRENCY = 4;

export function GuidedPathFlow({ mode, onBack }: GuidedPathFlowProps) {
  const goToPath = useGoToPath();
  const [selectedBook, setSelectedBook] = useState<BibleBook | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
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
    if (!selectedBook) return;
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

  function handleSelectVerse(verseNumber: number) {
    if (!selectedBook || !selectedChapter || !selectedVersion) return;
    goToPath(`${selectedBook.name}|${selectedChapter}|${verseNumber}`, "verse", selectedVersion);
  }

  if (status === "loading") {
    return <FetchLoading label={loadingLabel} />;
  }

  if (status === "error") {
    return <FetchError message={errorMessage} onRetry={() => setStatus("idle")} />;
  }

  if (startingPointFlow.pendingFinish && selectedBook) {
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

  if (intensityFlow.showLocationTagLevels) {
    return (
      <LocationTagLevelPicker
        onSelect={intensityFlow.handleSelectLocationTagLevels}
        onBack={intensityFlow.resetShowLocationTagLevels}
        initialPegSystemEnabled={intensityFlow.initialPegSystemEnabled}
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

  if (selectedBook && verseCount !== null && (mode === "book" || (mode === "chapter" && selectedChapter))) {
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

  if (selectedBook && selectedChapter && verseCount !== null && mode === "verse") {
    return (
      <VersePicker
        book={selectedBook.name}
        chapter={selectedChapter}
        totalVerses={verseCount}
        onSelectVerse={handleSelectVerse}
        onBack={() => {
          setVerseCount(null);
          setSelectedVersion(null);
        }}
      />
    );
  }

  if (selectedBook && (mode === "book" || selectedChapter)) {
    const title = mode === "book" ? selectedBook.name : formatChapterLabel(selectedBook.name, selectedChapter as number);
    return (
      <VersionPicker
        title={title}
        onSelectVersion={handleSelectVersion}
        onBack={() => (mode === "book" ? setSelectedBook(null) : setSelectedChapter(null))}
      />
    );
  }

  if (selectedBook) {
    return <ChapterGrid book={selectedBook} onSelectChapter={setSelectedChapter} onBack={() => setSelectedBook(null)} />;
  }

  return (
    <div className="flex flex-col gap-4">
      <button type="button" onClick={onBack} className="self-start text-sm font-medium text-brand-600 hover:underline">
        ← Choose a different way
      </button>
      <BookList books={BIBLE_BOOKS} onSelectBook={setSelectedBook} />
    </div>
  );
}
