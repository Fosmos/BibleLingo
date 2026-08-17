"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { BookMarked, BookOpen, Bookmark, type LucideIcon } from "lucide-react";
import type { BibleBook, VerseSegment } from "@/types";
import { BIBLE_BOOKS } from "@/lib/bibleBooks";
import { formatChapterLabel } from "@/lib/chapterContent";
import { ensurePathVerses, BibleFetchError } from "@/lib/bibleApiClient";
import { pathKey } from "@/lib/memorizationContent";
import { TAP_SCALE } from "@/lib/motionTokens";
import { BookList } from "@/components/gamification/BookList";
import { ChapterGrid } from "@/components/gamification/ChapterGrid";
import { VersePicker } from "@/components/gamification/VersePicker";
import { VersionPicker } from "@/components/gamification/VersionPicker";
import { FetchLoading, FetchError } from "@/components/ui/FetchStatus";
import { InfoTip } from "@/components/ui/InfoTip";
import { INFO_TIPS } from "@/lib/infoTipCopy";

export interface MasteryPassage {
  key: string;
  version: string;
  label: string;
  verses: VerseSegment[];
}

interface MasteryPassagePickerProps {
  onSelect: (passage: MasteryPassage) => void;
}

type Kind = "verse" | "chapter" | "book";

interface KindOption {
  kind: Kind;
  label: string;
  description: string;
  icon: LucideIcon;
}

const KIND_OPTIONS: KindOption[] = [
  { kind: "verse", label: "A Verse", description: "One verse, start to finish.", icon: Bookmark },
  { kind: "chapter", label: "A Chapter", description: "A whole chapter.", icon: BookOpen },
  { kind: "book", label: "A Book", description: "An entire book — the ultimate test.", icon: BookMarked },
];

export function MasteryPassagePicker({ onSelect }: MasteryPassagePickerProps) {
  const [kind, setKind] = useState<Kind | null>(null);
  const [book, setBook] = useState<BibleBook | null>(null);
  const [chapter, setChapter] = useState<number | null>(null);
  const [version, setVersion] = useState<string | null>(null);
  const [verseCount, setVerseCount] = useState<number | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [loadingLabel, setLoadingLabel] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function finish(identifier: string, resolvedKind: Kind, chosenVersion: string, label: string) {
    setStatus("loading");
    setLoadingLabel(`Loading ${label}…`);
    try {
      const key = pathKey(resolvedKind, identifier);
      const verses = await ensurePathVerses(key, chosenVersion);
      if (!verses || verses.length === 0) throw new BibleFetchError("Couldn't load that passage.");
      onSelect({ key, version: chosenVersion, label, verses });
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof BibleFetchError ? error.message : "Something went wrong loading that passage.");
    }
  }

  async function handleSelectVersion(chosenVersion: string) {
    if (!book || !kind) return;

    if (kind === "book") {
      await finish(book.name, "book", chosenVersion, book.name);
      return;
    }
    if (!chapter) return;

    if (kind === "chapter") {
      await finish(`${book.name}|${chapter}`, "chapter", chosenVersion, formatChapterLabel(book.name, chapter));
      return;
    }

    // Verse mode needs the chapter's length before it can show a verse grid.
    setStatus("loading");
    setLoadingLabel(`Loading ${formatChapterLabel(book.name, chapter)}…`);
    try {
      const verses = await ensurePathVerses(pathKey("chapter", `${book.name}|${chapter}`), chosenVersion);
      setVersion(chosenVersion);
      setVerseCount(verses?.length ?? 0);
      setStatus("idle");
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof BibleFetchError ? error.message : "Something went wrong loading that chapter.");
    }
  }

  function handleSelectVerse(verseNumber: number) {
    if (!book || !chapter || !version) return;
    finish(
      `${book.name}|${chapter}|${verseNumber}`,
      "verse",
      version,
      `${formatChapterLabel(book.name, chapter)}:${verseNumber}`,
    );
  }

  if (status === "loading") return <FetchLoading label={loadingLabel} />;
  if (status === "error") return <FetchError message={errorMessage} onRetry={() => setStatus("idle")} />;

  if (book && chapter && verseCount !== null && kind === "verse") {
    return (
      <VersePicker
        book={book.name}
        chapter={chapter}
        totalVerses={verseCount}
        onSelectVerse={handleSelectVerse}
        onBack={() => {
          setVerseCount(null);
          setVersion(null);
        }}
      />
    );
  }

  if (book && (kind === "book" || chapter)) {
    const title = kind === "book" ? book.name : formatChapterLabel(book.name, chapter as number);
    return (
      <VersionPicker
        title={title}
        onSelectVersion={handleSelectVersion}
        onBack={() => (kind === "book" ? setBook(null) : setChapter(null))}
      />
    );
  }

  if (book) {
    return <ChapterGrid book={book} onSelectChapter={setChapter} onBack={() => setBook(null)} />;
  }

  if (kind) {
    return (
      <div className="flex flex-col gap-4">
        <button type="button" onClick={() => setKind(null)} className="self-start text-sm font-medium text-brand-600 hover:underline">
          ← Choose a different way
        </button>
        <BookList books={BIBLE_BOOKS} onSelectBook={setBook} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="flex items-center gap-1.5 text-sm text-ink-muted">
        Pick what to test in Mastery Mode. <InfoTip text={INFO_TIPS.masteryPassagePicker} />
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {KIND_OPTIONS.map(({ kind: optionKind, label, description, icon: Icon }) => (
        <motion.button
          key={optionKind}
          type="button"
          whileTap={TAP_SCALE}
          onClick={() => setKind(optionKind)}
          className="flex flex-col items-start gap-2 rounded-xl border border-line bg-white p-4 text-left dark:border-zinc-800 dark:bg-zinc-900"
        >
          <Icon size={22} className="text-brand-500" />
          <span className="text-sm font-semibold text-ink dark:text-zinc-200">{label}</span>
          <span className="text-xs text-ink-muted">{description}</span>
        </motion.button>
      ))}
      </div>
    </div>
  );
}
