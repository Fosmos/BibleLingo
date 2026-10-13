"use client";

import { BIBLE_BOOKS } from "@/lib/bibleBooks";
import { booksInRegion, bookAbbreviation, type BibleRegionId } from "@/lib/bibleRegions";
import { useVerseMemory } from "@/lib/useVerseMemory";
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
}

const SECTIONS: BibleRegionId[] = ["Law", "History", "Wisdom", "Prophets", "Gospels", "Acts", "Letters", "Revelation"];

// The Path tab's top level (design_handoff_bible_progress): all 66 books as circles, grouped by
// section, shaded by verses known — tap one to open its chapters.
export function BibleProgressLevel({ filter, onFilter, hereBook, onOpenBook }: BibleProgressLevelProps) {
  const memory = useVerseMemory();
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
      <ProgressSummaryCard known={sum("known")} due={sum("due")} total={sum("total")} started={all.filter((entry) => entry.known > 0).length} of={66} unit="books" />
      <ProgressFilter heading="Books" value={filter} onChange={onFilter} />
      {SECTIONS.map((section) => {
        const books = booksInRegion(section);
        const entries = books.map((book) => stats(book.name));
        return (
          <ProgressGroupCard key={section} name={section} known={sum("known", entries)} due={sum("due", entries)} total={sum("total", entries)} columns={6}>
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
    </div>
  );
}
