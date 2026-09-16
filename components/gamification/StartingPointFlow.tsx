"use client";

import { useState } from "react";
import type { BibleBook } from "@/types";
import { formatChapterLabel } from "@/lib/chapterContent";
import { ensureChapterLoaded, BibleFetchError } from "@/lib/bibleApiClient";
import { ChapterGrid } from "@/components/gamification/ChapterGrid";
import { VersePicker } from "@/components/gamification/VersePicker";
import { StartingPointPrompt } from "@/components/gamification/StartingPointPrompt";
import { FetchLoading, FetchError } from "@/components/ui/FetchStatus";

interface StartingPointFlowProps {
  book: BibleBook;
  kind: "book" | "chapter";
  // Chapter mode only: the one chapter GuidedPathFlow.tsx already picked earlier, with its
  // own already-known verse count — book mode instead lets the reader pick ANY chapter here,
  // fetched on demand as they go.
  fixedChapter?: number;
  fixedChapterVerseCount?: number;
  version: string;
  onStartFromBeginning: () => void;
  onPickStartingPoint: (chapter: number, verseNumber: number) => void;
  onBack: () => void;
}

type Step = "prompt" | "chapter" | "verse";

// GuidedPathFlow.tsx's own last step for book/chapter mode, split out purely to keep that
// file under this codebase's 200-line cap — asks whether the reader's already memorized part
// of what they just picked and, if so, which chapter/verse they've gotten through, then hands
// that back so the caller can turn it into an actual starting point (see lib/dayPlan.ts's
// priorKnownVerseCountThrough).
export function StartingPointFlow({
  book,
  kind,
  fixedChapter,
  fixedChapterVerseCount,
  version,
  onStartFromBeginning,
  onPickStartingPoint,
  onBack,
}: StartingPointFlowProps) {
  const [step, setStep] = useState<Step>("prompt");
  const [chapter, setChapter] = useState<number | null>(fixedChapter ?? null);
  const [chapterVerseCount, setChapterVerseCount] = useState<number | null>(fixedChapterVerseCount ?? null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSelectChapter(selected: number) {
    setStatus("loading");
    setErrorMessage("");
    try {
      const verses = await ensureChapterLoaded(book.name, selected, version);
      setChapter(selected);
      setChapterVerseCount(verses.length);
      setStep("verse");
      setStatus("idle");
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof BibleFetchError ? error.message : "Something went wrong loading that chapter.");
    }
  }

  if (status === "loading") return <FetchLoading label={chapter ? `Loading ${formatChapterLabel(book.name, chapter)}…` : "Loading…"} />;
  if (status === "error") return <FetchError message={errorMessage} onRetry={() => setStatus("idle")} />;

  if (step === "verse" && chapter !== null && chapterVerseCount !== null) {
    return (
      <VersePicker
        book={book.name}
        chapter={chapter}
        totalVerses={chapterVerseCount}
        onSelectVerse={(verseNumber) => onPickStartingPoint(chapter, verseNumber)}
        onBack={() => setStep(kind === "book" ? "chapter" : "prompt")}
        backLabel={kind === "book" ? "← Chapters" : "← Back"}
        prompt="Which verse have you memorized through?"
      />
    );
  }

  if (step === "chapter") {
    return (
      <ChapterGrid
        book={book}
        onSelectChapter={handleSelectChapter}
        onBack={() => setStep("prompt")}
        backLabel="← Back"
        prompt="Which chapter have you gotten through?"
      />
    );
  }

  return (
    <StartingPointPrompt
      label={kind === "chapter" && fixedChapter ? formatChapterLabel(book.name, fixedChapter) : book.name}
      onStartFromBeginning={onStartFromBeginning}
      onPickStartingPoint={() => setStep(kind === "book" ? "chapter" : "verse")}
      onBack={onBack}
    />
  );
}
