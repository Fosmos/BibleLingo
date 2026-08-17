"use client";

import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { BIBLE_BOOKS, findBook } from "@/lib/bibleBooks";
import { BIBLE_VERSIONS } from "@/lib/bibleVersions";
import { ensureChapterLoaded, BibleFetchError } from "@/lib/bibleApiClient";
import { overlapsExistingEntity } from "@/lib/memorizedEntities";
import { useProgressStore } from "@/store/useProgressStore";
import { TAP_SCALE } from "@/lib/motionTokens";

export interface VerseRangeSelection {
  book: string;
  chapter: number;
  startVerse: number;
  endVerse: number;
  version: string;
}

interface ManualVerseRangeFormProps {
  onValid: (selection: VerseRangeSelection) => void;
  onCancel: () => void;
}

const INPUT_CLASS =
  "rounded-xl border border-line bg-white p-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:border-zinc-700 dark:bg-zinc-900";

export function ManualVerseRangeForm({ onValid, onCancel }: ManualVerseRangeFormProps) {
  const memorizedEntities = useProgressStore((state) => state.memorizedEntities);
  const [book, setBook] = useState(BIBLE_BOOKS[0].name);
  const [chapter, setChapter] = useState("1");
  const [startVerse, setStartVerse] = useState("1");
  const [endVerse, setEndVerse] = useState("1");
  const [version, setVersion] = useState(BIBLE_VERSIONS[0].code);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const selectedBook = findBook(book);
    const chapterNum = Number(chapter);
    const startNum = Number(startVerse);
    const endNum = Number(endVerse);

    if (!selectedBook || !Number.isInteger(chapterNum) || chapterNum < 1 || chapterNum > selectedBook.chapterCount) {
      setError("Enter a valid chapter number.");
      return;
    }
    if (!Number.isInteger(startNum) || !Number.isInteger(endNum) || startNum < 1 || endNum < startNum) {
      setError("Enter a valid verse range.");
      return;
    }
    if (overlapsExistingEntity(memorizedEntities, book, chapterNum, startNum, endNum)) {
      setError("Some or all of these verses are already being tracked.");
      return;
    }

    setLoading(true);
    try {
      const verses = await ensureChapterLoaded(book, chapterNum, version);
      if (endNum > verses.length) {
        setError(`${book} ${chapterNum} only has ${verses.length} verses.`);
        return;
      }
      onValid({ book, chapter: chapterNum, startVerse: startNum, endVerse: endNum, version });
    } catch (err) {
      setError(err instanceof BibleFetchError ? err.message : "Couldn't load that chapter.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <p className="text-sm font-semibold text-ink-soft dark:text-zinc-300">Add a verse you already know</p>
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
      <div className="grid grid-cols-3 gap-2">
        <label className="flex flex-col gap-1 text-xs text-ink-muted">
          Chapter
          <input type="number" min={1} value={chapter} onChange={(event) => setChapter(event.target.value)} className={INPUT_CLASS} />
        </label>
        <label className="flex flex-col gap-1 text-xs text-ink-muted">
          Start verse
          <input type="number" min={1} value={startVerse} onChange={(event) => setStartVerse(event.target.value)} className={INPUT_CLASS} />
        </label>
        <label className="flex flex-col gap-1 text-xs text-ink-muted">
          End verse
          <input type="number" min={1} value={endVerse} onChange={(event) => setEndVerse(event.target.value)} className={INPUT_CLASS} />
        </label>
      </div>
      {error && <p className="text-sm font-medium text-heart-600">{error}</p>}
      <div className="flex items-center gap-3">
        <motion.button
          type="submit"
          whileTap={loading ? undefined : TAP_SCALE}
          disabled={loading}
          className="self-start rounded-full bg-brand-500 px-5 py-2 text-sm font-semibold text-white disabled:opacity-40"
        >
          {loading ? "Checking…" : "Continue"}
        </motion.button>
        <button type="button" onClick={onCancel} className="text-sm font-medium text-ink-muted hover:underline">
          Cancel
        </button>
      </div>
    </form>
  );
}
