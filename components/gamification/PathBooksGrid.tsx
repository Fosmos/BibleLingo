"use client";

import { chapterFill, chapterSeal, type RingChapter } from "@/lib/verseRings";
import { VerseRing } from "@/components/gamification/VerseRing";

interface PathBooksGridProps {
  chapters: RingChapter[];
  onOpen: (chapter: number) => void;
}

// The Path tab's book view, laid out like the Memorized page's Bible (MemorizedBooksList.tsx): each of
// the path's books in the left column, its chapters in small boxes beside it — filled green as they're
// memorized, a seal when complete, a dot when due, a green outline where today's verses are.
export function PathBooksGrid({ chapters, onOpen }: PathBooksGridProps) {
  const books = [...new Set(chapters.map((chapter) => chapter.book))];
  return (
    <div className="flex flex-col">
      {books.map((book) => {
        const within = chapters.filter((chapter) => chapter.book === book);
        const known = within.reduce((sum, chapter) => sum + chapter.known, 0);
        const total = within.reduce((sum, chapter) => sum + chapter.total, 0);
        return (
          <section key={book} className="grid grid-cols-[96px_minmax(0,1fr)] gap-x-3 border-t border-sand-200 py-2.5 dark:border-zinc-900">
            <div className="flex min-w-0 flex-col gap-0.5">
              <h2 className="truncate text-[14px] font-extrabold leading-tight text-ink dark:text-zinc-100">{book}</h2>
              <span className="text-[11px] font-bold text-ink-muted">
                {known} of {total} verses
              </span>
            </div>
            <div className="grid content-start grid-cols-7">
              {within.map((chapter) => {
                const due = (chapter.age ?? 0) >= 1;
                const kind = chapter.hasToday ? "today" : chapter.age !== undefined ? "learned" : "new";
                return (
                  <div key={chapter.chapter} data-next={chapter.hasNext || undefined}>
                    <VerseRing size="mini" kind={kind} age={chapter.age ?? 0} seal={chapterSeal(chapter)} fill={chapter.age !== undefined ? chapterFill(chapter) : undefined} due={due} label={`Open chapter ${chapter.chapter}, ${chapter.known} ${chapter.known === 1 ? "verse" : "verses"} learned${due ? ", review due" : ""}`} onTap={() => onOpen(chapter.chapter)}>
                      {chapter.chapter}
                    </VerseRing>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
