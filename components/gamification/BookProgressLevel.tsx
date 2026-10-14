"use client";

import { useMemo } from "react";
import { findBook } from "@/lib/bibleBooks";
import { bookMovements } from "@/lib/bookMovements";
import { useVerseMemory } from "@/lib/useVerseMemory";
import { useProgressStore } from "@/store/useProgressStore";
import { computeMemorizedStats } from "@/lib/progressSummary";
import { sealTier } from "@/lib/srsSeals";
import { useMemorizedChaptersLoaded } from "@/lib/useMemorizedChaptersLoaded";
import { heldCount } from "@/lib/verseMemoryState";
import { bookLength, chapterLength, matchesFilter, type ProgressFilter as Filter } from "@/lib/bibleProgress";
import { ProgressHeader } from "@/components/gamification/ProgressHeader";
import { ProgressSummaryCard } from "@/components/gamification/ProgressSummaryCard";
import { ProgressFilter } from "@/components/gamification/ProgressFilter";
import { ProgressGroupCard } from "@/components/gamification/ProgressGroupCard";
import { ProgressCircle } from "@/components/gamification/ProgressCircle";
import { ProgressKey } from "@/components/gamification/ProgressKey";

interface BookProgressLevelProps {
  book: string;
  filter: Filter;
  onFilter: (filter: Filter) => void;
  // The active path's chapter in this book (ringed), if any.
  hereChapter: number | null;
  onBible: () => void;
  onOpenChapter: (chapter: number) => void;
}

// The Path tab's Book level (design_handoff_bible_progress): the book's chapters as circles,
// grouped by its themes (lib/bookMovements.ts) — tap one to read it in sense lines.
export function BookProgressLevel({ book, filter, onFilter, hereChapter, onBible, onOpenChapter }: BookProgressLevelProps) {
  const memory = useVerseMemory();
  // This book's ranges in spaced review — its fully memorized chapters and verses, as on the Memorized page.
  const entities = useProgressStore((state) => state.memorizedEntities);
  const bookEntities = useMemo(() => entities.filter((entity) => entity.book === book), [entities, book]);
  useMemorizedChaptersLoaded(bookEntities);
  const chapterCount = findBook(book)?.chapterCount ?? 1;
  const stats = (chapter: number) => {
    const counts = memory.chapter(book, chapter);
    const known = heldCount(counts);
    const { total, exact } = chapterLength(book, chapter);
    return { known, due: counts.due, total, complete: exact && known >= total };
  };
  const chapters = Array.from({ length: chapterCount }, (_, index) => stats(index + 1));
  const bookCounts = memory.book(book);
  const known = heldCount(bookCounts);
  const total = bookLength(book);
  const sum = (key: "known" | "due" | "total", list: ReturnType<typeof stats>[]) => list.reduce((n, entry) => n + entry[key], 0);

  return (
    <div className="flex h-full flex-col gap-[18px] overflow-y-auto px-[18px] pb-[140px] pt-1.5 [scrollbar-width:none]">
      <ProgressHeader crumbs={[{ label: "Bible", onTap: onBible }, { label: book }]} eyebrow={`${chapterCount} ${chapterCount === 1 ? "chapter" : "chapters"}`} title={book} />
      <ProgressSummaryCard
        known={known}
        due={bookCounts.due}
        total={total}
        stats={computeMemorizedStats(bookEntities)}
        showBooks={false}
      />
      <ProgressFilter heading="Chapters" value={filter} onChange={onFilter} />
      {bookMovements(book).map((movement) => {
        const entries = movement.chapters.map((chapter) => chapters[chapter - 1]);
        const single = movement.chapters.length === 1;
        return (
          <ProgressGroupCard
            key={movement.range}
            kicker={single ? `Chapter ${movement.range}` : `Chapters ${movement.range}`}
            name={movement.title}
            known={sum("known", entries)}
            due={sum("due", entries)}
            total={sum("total", entries)}
            columns={5}
          >
            {movement.chapters.map((chapter, index) => {
              const entry = entries[index];
              return (
                <ProgressCircle
                  key={chapter}
                  level="chapter"
                  label={`${chapter}`}
                  subLabel={entry.complete ? "All" : entry.known ? `${entry.known}/${entry.total}` : ""}
                  known={entry.known}
                  complete={entry.complete}
                  seal={entry.complete ? sealTier(bookEntities, { book, chapter }) : null}
                  due={entry.due > 0}
                  here={chapter === hereChapter}
                  faded={!matchesFilter(filter, entry.known, entry.due)}
                  ariaLabel={`${book} ${chapter}${entry.known ? `, ${entry.known} verses known` : ""}${entry.due ? `, ${entry.due} due` : ""}`}
                  onTap={() => onOpenChapter(chapter)}
                />
              );
            })}
          </ProgressGroupCard>
        );
      })}
      <ProgressKey level="chapter" />
    </div>
  );
}
