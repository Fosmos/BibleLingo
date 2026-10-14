"use client";

import type { ReactNode } from "react";
import { BIBLE_BOOKS } from "@/lib/bibleBooks";
import { bookAbbreviation } from "@/lib/bibleRegions";
import { useVerseMemory } from "@/lib/useVerseMemory";
import { useProgressStore } from "@/store/useProgressStore";
import { computeMemorizedStats } from "@/lib/progressSummary";
import { sealTier } from "@/lib/srsSeals";
import { useMemorizedChaptersLoaded } from "@/lib/useMemorizedChaptersLoaded";
import { heldCount } from "@/lib/verseMemoryState";
import { bookLength, matchesFilter, type ProgressFilter as Filter } from "@/lib/bibleProgress";
import { ProgressHeader } from "@/components/gamification/ProgressHeader";
import { ProgressSummaryCard } from "@/components/gamification/ProgressSummaryCard";
import { ProgressFilter } from "@/components/gamification/ProgressFilter";
import { ProgressGroupCard } from "@/components/gamification/ProgressGroupCard";
import { ProgressCircle } from "@/components/gamification/ProgressCircle";
import { ProgressKey } from "@/components/gamification/ProgressKey";

interface BibleProgressLevelProps {
  filter: Filter;
  onFilter: (filter: Filter) => void;
  // The active path's book (ringed).
  hereBook: string;
  onOpenBook: (book: string) => void;
  // Shown under the books (the Memorized tab's "Where you stumble").
  footer?: ReactNode;
}

const TESTAMENTS = [
  { id: "old", name: "Old Testament" },
  { id: "new", name: "New Testament" },
] as const;

// The Path tab's top level (design_handoff_bible_progress): all 66 books as circles, grouped by
// testament, shaded by verses known — tap one to open its chapters.
export function BibleProgressLevel({ filter, onFilter, hereBook, onOpenBook, footer }: BibleProgressLevelProps) {
  const memory = useVerseMemory();
  const entities = useProgressStore((state) => state.memorizedEntities);
  // Re-renders as memorized chapters' text arrives, so whole books added by hand count (as on the Memorized page).
  useMemorizedChaptersLoaded(entities);
  const stats = (name: string) => {
    const counts = memory.book(name);
    const known = heldCount(counts);
    return { known, due: counts.due, total: bookLength(name), complete: known >= bookLength(name) };
  };
  const all = BIBLE_BOOKS.map((book) => stats(book.name));
  const sum = (key: "known" | "due" | "total", list = all) => list.reduce((n, entry) => n + entry[key], 0);

  return (
    <div className="flex h-full flex-col gap-[18px] overflow-y-auto px-[18px] pb-[140px] pt-1.5 [scrollbar-width:none]">
      <ProgressHeader crumbs={[{ label: "Bible" }]} eyebrow="Genesis to Revelation" title="Your Bible" />
      <ProgressSummaryCard known={sum("known")} due={sum("due")} total={sum("total")} stats={computeMemorizedStats(entities)} />
      <ProgressFilter heading="Books" value={filter} onChange={onFilter} />
      {TESTAMENTS.map((testament) => {
        const books = BIBLE_BOOKS.filter((book) => book.testament === testament.id);
        const entries = books.map((book) => stats(book.name));
        return (
          <ProgressGroupCard key={testament.id} name={testament.name} known={sum("known", entries)} due={sum("due", entries)} total={sum("total", entries)} columns={6}>
            {books.map((book, index) => {
              const { known, due, complete } = entries[index];
              return (
                <ProgressCircle
                  key={book.name}
                  level="book"
                  label={bookAbbreviation(book.name)}
                  subLabel={complete ? "All" : known ? `${known}` : ""}
                  known={known}
                  complete={complete}
                  seal={complete ? sealTier(entities, { book: book.name }) : null}
                  due={due > 0}
                  here={book.name === hereBook}
                  faded={!matchesFilter(filter, known, due)}
                  ariaLabel={`${book.name}${known ? `, ${known} verses known` : ""}${due ? `, ${due} due` : ""}`}
                  onTap={() => onOpenBook(book.name)}
                />
              );
            })}
          </ProgressGroupCard>
        );
      })}
      <ProgressKey level="book" />
      {footer}
    </div>
  );
}
