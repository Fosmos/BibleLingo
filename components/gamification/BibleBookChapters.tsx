"use client";

import type { MouseEvent } from "react";
import { findBook } from "@/lib/bibleBooks";
import { bookMovements } from "@/lib/bookMovements";
import { useChapterThemes } from "@/lib/useChapterThemes";
import type { BibleHeld } from "@/lib/useBibleHeld";
import { BibleLevelHeader } from "@/components/gamification/BibleLevelHeader";
import { BibleChapterWheel } from "@/components/gamification/BibleChapterWheel";
import { BibleMovementList } from "@/components/gamification/BibleMovementList";

interface BibleBookChaptersProps {
  book: string;
  pathChapter: number;
  held: BibleHeld;
  onOpen: (chapter: number, event: MouseEvent<HTMLElement>) => void;
}

// The Path tab's level 2 — a book's chapters: a wheel of movements for an outlined book of up to
// 30 chapters, otherwise a list of its movements.
export function BibleBookChapters({ book, pathChapter, held, onOpen }: BibleBookChaptersProps) {
  const chapterCount = findBook(book)?.chapterCount ?? 1;
  const movements = bookMovements(book);
  const wheel = movements.length > 1 && chapterCount <= 30;
  const themeOf = useChapterThemes(book, wheel ? [pathChapter || movements[0].chapters[0]] : []);
  const count = held.heldIn(book);
  const sub = `${chapterCount} chapter${chapterCount === 1 ? "" : "s"} · ${movements.length} movement${movements.length === 1 ? "" : "s"}${count ? ` · ${count} verses memorized` : ""}`;

  return (
    <div className="h-full overflow-y-auto px-4 pb-28">
      <BibleLevelHeader title={book} sub={sub} />
      {wheel ? (
        <BibleChapterWheel movements={movements} pathChapter={pathChapter} themeOf={themeOf} onOpen={onOpen} />
      ) : (
        <BibleMovementList book={book} movements={movements} pathChapter={pathChapter} held={held} onOpen={onOpen} />
      )}
    </div>
  );
}
