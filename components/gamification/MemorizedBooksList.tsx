"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { MemorizedEntity } from "@/types";
import { BIBLE_BOOKS } from "@/lib/bibleBooks";
import { libraryBooks } from "@/lib/memorizedLibrary";
import { shelfChapters, shelfHref } from "@/lib/memorizedShelf";
import { chapterFill, chapterSeal } from "@/lib/verseRings";
import { VerseRing } from "@/components/gamification/VerseRing";

interface MemorizedBooksListProps {
  entities: MemorizedEntity[];
}

// A long book's grid stops a row past its last chapter with anything memorized, with a way to see it all.
const ROW = 7;
const LONG_BOOK = 42;

// The Memorized tab's books, in Bible order — only those with at least one verse memorized: each book's
// name in the left column, its chapters in small boxes beside it (filled green as they're memorized, a
// seal when complete, a dot when due).
export function MemorizedBooksList({ entities }: MemorizedBooksListProps) {
  const router = useRouter();
  const [now] = useState(() => new Date());
  const [opened, setOpened] = useState<Set<string>>(new Set());
  const counts = useMemo(() => new Map(libraryBooks(entities, now).map((group) => [group.book, group.verseCount])), [entities, now]);
  const open = (book: string) => setOpened((prev) => new Set(prev).add(book));

  return (
    <section className="flex flex-col" aria-label="Your Bible by book">
      {BIBLE_BOOKS.map((book) => {
        const verses = counts.get(book.name) ?? 0;
        if (!verses) return null;
        const chapters = shelfChapters(book.name, book.chapterCount, entities, now);
        const lastTouched = chapters.reduce((last, chapter) => (chapter.known ? chapter.chapter : last), 0);
        const cut = book.chapterCount > LONG_BOOK && !opened.has(book.name) ? Math.max(ROW * 2, Math.ceil((lastTouched + 1) / ROW) * ROW) : book.chapterCount;
        return (
          <div key={book.name} className="grid grid-cols-[96px_minmax(0,1fr)] gap-x-3 border-t border-sand-200 py-2.5 dark:border-zinc-900">
            <Link href={shelfHref(book.name)} className="flex min-w-0 flex-col gap-0.5 self-start">
              <span className="truncate text-[14px] font-extrabold leading-tight text-ink dark:text-zinc-100">{book.name}</span>
              <span className="text-[11px] font-bold text-ink-muted">{verses} {verses === 1 ? "verse" : "verses"}</span>
            </Link>
            <div className="grid content-start grid-cols-7">
              {chapters.slice(0, cut).map((chapter) => {
                const due = (chapter.age ?? 0) >= 1;
                return (
                  <VerseRing key={chapter.chapter} size="mini" kind={chapter.age !== undefined ? "learned" : "new"} age={chapter.age ?? 0} seal={chapterSeal(chapter)} fill={chapter.age !== undefined ? chapterFill(chapter) : undefined} due={due} label={`${book.name} ${chapter.chapter}${chapter.known ? `, ${chapter.known} ${chapter.known === 1 ? "verse" : "verses"} memorized` : ""}${due ? ", review due" : ""}`} onTap={() => router.push(shelfHref(book.name, chapter.chapter))}>
                    {chapter.chapter}
                  </VerseRing>
                );
              })}
              {cut < book.chapterCount && (
                <button type="button" onClick={() => open(book.name)} className="col-span-7 min-h-9 text-left text-[13px] font-extrabold text-brand-700 dark:text-brand-300">
                  All {book.chapterCount} chapters
                </button>
              )}
            </div>
          </div>
        );
      })}
    </section>
  );
}
