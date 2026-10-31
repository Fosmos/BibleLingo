"use client";

import { useMemo, useState } from "react";
import type { BuiltPalace } from "@/types";
import { findBook } from "@/lib/bibleBooks";
import { chapterLoci } from "@/lib/chapterLoci";
import { useChapterText } from "@/lib/useChapterText";
import { useProgressStore } from "@/store/useProgressStore";
import { ReaderLocusSheet } from "@/components/gamification/ReaderLocusSheet";

interface BookLocusSheetProps {
  book: string;
  version: string;
  chapter: number;
  // From a whole book's view: the chapter can be changed on the sheet.
  chooseChapter?: boolean;
  onClose: () => void;
}

const NONE: BuiltPalace[] = [];

// The add-a-locus screen opened away from the reader (the Path tab's book and chapter views, the
// Bible's book level): it loads the chapter's verses itself.
export function BookLocusSheet({ book, version, chapter: startChapter, chooseChapter = false, onClose }: BookLocusSheetProps) {
  const [chapter, setChapter] = useState(startChapter);
  const [changed, setChanged] = useState(false);
  const { verses, error } = useChapterText(book, chapter, version, false);
  const palaces = useProgressStore((state) => state.builtPalaces) ?? NONE;
  const loci = useMemo(() => chapterLoci(palaces, book, chapter), [palaces, book, chapter]);
  const real = useMemo(() => (verses ?? []).filter((verse) => verse.text.trim()), [verses]);
  if (!verses && !error && !changed) return null;

  const picker = chooseChapter ? (
    <label className="flex flex-col gap-1 text-[13px] font-extrabold text-sand-700 dark:text-zinc-400">
      Chapter of {book}
      <select
        value={chapter}
        onChange={(event) => {
          setChapter(Number(event.target.value));
          setChanged(true);
        }}
        className="w-full rounded-xl border border-sand-300 bg-paper px-3 py-2.5 text-[15px] font-medium text-ink dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
      >
        {Array.from({ length: findBook(book)?.chapterCount ?? 1 }, (_, index) => (
          <option key={index} value={index + 1}>
            {index + 1}
          </option>
        ))}
      </select>
    </label>
  ) : undefined;

  return <ReaderLocusSheet key={`${chapter}|${Boolean(verses)}`} book={book} chapter={chapter} verses={real} loci={loci} picker={picker} animateIn={!changed} onClose={onClose} />;
}
