"use client";

import { booksInRegion } from "@/lib/bibleRegions";
import { useVerseMemory } from "@/lib/useVerseMemory";
import { heldCount } from "@/lib/verseMemoryState";
import { BookSpine } from "@/components/gamification/BookSpine";
import { ChapterDrawer } from "@/components/gamification/ChapterDrawer";

interface BibleShelvesProps {
  openBook: string | null;
  onToggleBook: (book: string | null) => void;
  onOpenChapter: (book: string, chapter: number) => void;
}

// Canon order, not the old board's treemap order.
const SHELF_ORDER = ["Law", "History", "Wisdom", "Prophets", "Gospels", "Acts", "Letters", "Revelation"] as const;

// The Path tab's level 0 (design_handoff_chapter_path_view/shelf_path): one shelf per region, one
// spine per book filled by what's memorized; tapping a spine pulls it out and opens its chapter
// drawer under that shelf (one at a time — tap again to close).
export function BibleShelves({ openBook, onToggleBook, onOpenChapter }: BibleShelvesProps) {
  const memory = useVerseMemory();
  const shelves = SHELF_ORDER.map((id) => {
    const books = booksInRegion(id);
    return { id, books, totals: books.map((book) => memory.book(book.name)) };
  });
  const totalDue = shelves.reduce((sum, shelf) => sum + shelf.totals.reduce((n, counts) => n + counts.due, 0), 0);

  return (
    <div className="flex h-full flex-col">
      <header className="flex shrink-0 items-end gap-2 px-[18px] pb-3 pt-1">
        <div className="flex flex-1 flex-col gap-0.5">
          <span className="text-[11px] font-extrabold uppercase tracking-[.06em] text-sage-800 dark:text-sage-300">Choose a path</span>
          <h1 className="font-heading text-[28px] leading-[1.05] text-ink dark:text-zinc-100">Your shelves</h1>
        </div>
        {totalDue > 0 && <span className="whitespace-nowrap rounded-full bg-brand-100 px-2.5 py-1 text-xs font-extrabold text-brand-800">{totalDue} due</span>}
      </header>
      <div className="flex min-h-0 flex-1 flex-col gap-[18px] overflow-y-auto px-4 pb-[120px]">
        {shelves.map(({ id, books, totals }) => {
          const verses = totals.reduce((n, counts) => n + heldCount(counts), 0);
          const due = totals.reduce((n, counts) => n + counts.due, 0);
          const drawerBook = books.find((book) => book.name === openBook);
          return (
            <section key={id} className="flex shrink-0 flex-col gap-1.5">
              <div className="flex items-baseline gap-2 px-1">
                <span className="flex-1 text-xs font-extrabold uppercase tracking-[.06em] text-ink-muted">{id}</span>
                {verses > 0 && (
                  <span className={`text-xs font-bold ${due ? "text-brand-800 dark:text-brand-300" : "text-ink-muted"}`}>
                    {verses} verses{due ? ` · ${due} due` : ""}
                  </span>
                )}
              </div>
              {/* A long shelf (Letters, Prophets) scrolls sideways rather than squeezing its spines. */}
              <div className="flex h-[132px] items-end gap-[3px] overflow-x-auto px-1.5 pt-3 [scrollbar-width:none]">
                {books.map((book, index) => (
                  <BookSpine key={book.name} book={book} counts={totals[index]} pulled={book.name === openBook} onTap={() => onToggleBook(book.name === openBook ? null : book.name)} />
                ))}
              </div>
              <div className="h-2 rounded-full bg-sand-400 dark:bg-zinc-700" />
              {drawerBook && <ChapterDrawer book={drawerBook} onOpen={(chapter) => onOpenChapter(drawerBook.name, chapter)} />}
            </section>
          );
        })}
      </div>
    </div>
  );
}
