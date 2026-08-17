"use client";

import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { BIBLE_BOOKS, findBook } from "@/lib/bibleBooks";
import { BIBLE_VERSIONS } from "@/lib/bibleVersions";
import { ensureChapterLoaded, BibleFetchError } from "@/lib/bibleApiClient";
import { mapWithConcurrency } from "@/lib/fetchWithConcurrency";
import { TAP_SCALE } from "@/lib/motionTokens";

export interface WholeBookSelection {
  book: string;
  chapterVerseCounts: number[];
  version: string;
}

interface ManualWholeBookFormProps {
  onValid: (selection: WholeBookSelection) => void;
  onCancel: () => void;
}

const INPUT_CLASS =
  "rounded-xl border border-line bg-white p-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:border-zinc-700 dark:bg-zinc-900";

const BOOK_FETCH_CONCURRENCY = 4;

export function ManualWholeBookForm({ onValid, onCancel }: ManualWholeBookFormProps) {
  const [book, setBook] = useState(BIBLE_BOOKS[0].name);
  const [version, setVersion] = useState(BIBLE_VERSIONS[0].code);
  const [loading, setLoading] = useState(false);
  const [loadedChapters, setLoadedChapters] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const selectedBook = findBook(book);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (!selectedBook) {
      setError("Pick a book.");
      return;
    }

    setLoading(true);
    setLoadedChapters(0);
    const chapters = Array.from({ length: selectedBook.chapterCount }, (_, index) => index + 1);
    try {
      let loaded = 0;
      const chapterVerseCounts = await mapWithConcurrency(chapters, BOOK_FETCH_CONCURRENCY, async (chapter) => {
        const verses = await ensureChapterLoaded(book, chapter, version);
        loaded += 1;
        setLoadedChapters(loaded);
        return verses.length;
      });
      onValid({ book, chapterVerseCounts, version });
    } catch (err) {
      setError(err instanceof BibleFetchError ? err.message : `Couldn't load ${book}.`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <p className="text-sm font-semibold text-ink-soft dark:text-zinc-300">Add a whole book you already know</p>
      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1 text-xs text-ink-muted">
          Book
          <select value={book} onChange={(event) => setBook(event.target.value)} className={INPUT_CLASS}>
            {BIBLE_BOOKS.map((candidate) => (
              <option key={candidate.name} value={candidate.name}>
                {candidate.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-ink-muted">
          Translation
          <select value={version} onChange={(event) => setVersion(event.target.value)} className={INPUT_CLASS}>
            {BIBLE_VERSIONS.map((candidate) => (
              <option key={candidate.code} value={candidate.code}>
                {candidate.code}
              </option>
            ))}
          </select>
        </label>
      </div>
      {selectedBook && (
        <p className="text-xs text-ink-muted">
          This loads all {selectedBook.chapterCount} chapters of {book} to count verses — it may take a moment.
        </p>
      )}
      {loading && (
        <p className="text-xs text-ink-muted">
          Loading chapter {loadedChapters} of {selectedBook?.chapterCount ?? "?"}…
        </p>
      )}
      {error && <p className="text-sm font-medium text-heart-600">{error}</p>}
      <div className="flex items-center gap-3">
        <motion.button
          type="submit"
          whileTap={loading ? undefined : TAP_SCALE}
          disabled={loading}
          className="self-start rounded-full bg-brand-500 px-5 py-2 text-sm font-semibold text-white disabled:opacity-40"
        >
          {loading ? "Loading…" : "Continue"}
        </motion.button>
        <button type="button" onClick={onCancel} className="text-sm font-medium text-ink-muted hover:underline">
          Cancel
        </button>
      </div>
    </form>
  );
}
