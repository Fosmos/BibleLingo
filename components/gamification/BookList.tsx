"use client";

import { motion } from "framer-motion";
import type { BibleBook } from "@/types";
import { TAP_SCALE } from "@/lib/motionTokens";
import { InfoTip } from "@/components/ui/InfoTip";
import { INFO_TIPS } from "@/lib/infoTipCopy";

interface BookListProps {
  books: BibleBook[];
  onSelectBook: (book: BibleBook) => void;
}

export function BookList({ books, onSelectBook }: BookListProps) {
  const oldTestament = books.filter((book) => book.testament === "old");
  const newTestament = books.filter((book) => book.testament === "new");

  return (
    <div className="flex flex-col gap-6">
      <p className="flex items-center gap-1.5 text-sm text-ink-muted">
        Pick a book to build a path from. <InfoTip text={INFO_TIPS.bookChapterGrid} />
      </p>
      <BookGroup title="Old Testament" books={oldTestament} onSelectBook={onSelectBook} />
      <BookGroup title="New Testament" books={newTestament} onSelectBook={onSelectBook} />
    </div>
  );
}

interface BookGroupProps {
  title: string;
  books: BibleBook[];
  onSelectBook: (book: BibleBook) => void;
}

function BookGroup({ title, books, onSelectBook }: BookGroupProps) {
  return (
    <div>
      <h3 className="mb-2 text-caption font-semibold uppercase tracking-wide text-ink-muted">{title}</h3>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {books.map((book) => (
          <motion.button
            key={book.name}
            type="button"
            whileTap={TAP_SCALE}
            onClick={() => onSelectBook(book)}
            aria-label={book.name}
            className="rounded-lg bg-mist px-3 py-2 text-left text-sm font-medium text-ink-soft dark:bg-zinc-800 dark:text-zinc-300"
          >
            {book.name}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
