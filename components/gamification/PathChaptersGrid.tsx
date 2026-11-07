"use client";

import { verseSeal, type RingChapter, type RingVerse } from "@/lib/verseRings";
import { VerseRing } from "@/components/gamification/VerseRing";

interface PathChaptersGridProps {
  chapters: RingChapter[];
  // Open a chapter, with its sections and loci (BookStructureChapter.tsx).
  onOpen: (chapter: number) => void;
  onTapVerse: (verse: RingVerse) => void;
}

const STATE: Record<RingVerse["kind"], string> = {
  next: "up next",
  today: "to learn today",
  learned: "learned",
  new: "not learned yet",
};

// The Path tab's book view: each of the path's chapters in the left column, its verses in small boxes
// beside it — filled as they're learned, coloured by how close their review is, a green outline on
// today's. A path across more than one book puts each book's name over its chapters.
export function PathChaptersGrid({
  chapters,
  onOpen,
  onTapVerse,
}: PathChaptersGridProps) {
  const books = [...new Set(chapters.map((chapter) => chapter.book))];
  return (
    <div className="flex flex-col">
      {books.map((book) => (
        <section key={book} className="flex flex-col" aria-label={book}>
          {books.length > 1 && (
            <h2 className="pb-1 pt-3 font-heading text-[19px] leading-tight text-ink dark:text-zinc-100">
              {book}
            </h2>
          )}
          {chapters
            .filter((chapter) => chapter.book === book)
            .map((chapter) => {
              const verses = chapter.passages.flatMap(
                (passage) => passage.verses,
              );
              return (
                <div
                  key={chapter.chapter}
                  className="grid grid-cols-[96px_minmax(0,1fr)] gap-x-3 border-t border-sand-200 py-2.5 dark:border-zinc-900"
                >
                  <button
                    type="button"
                    onClick={() => onOpen(chapter.chapter)}
                    className="flex min-w-0 flex-col gap-0.5 self-start text-left"
                  >
                    <span className="truncate text-[14px] font-extrabold leading-tight text-ink dark:text-zinc-100">
                      Chapter {chapter.chapter}
                    </span>
                    <span className="text-[11px] font-bold text-ink-muted">
                      {chapter.known} of {chapter.total || verses.length} verses
                    </span>
                  </button>
                  <div className="grid content-start grid-cols-7">
                    {verses.map((ring) => (
                      <div
                        key={ring.stop.key}
                        data-next={ring.kind === "next" || undefined}
                      >
                        <VerseRing
                          size="mini"
                          kind={ring.kind}
                          age={ring.age}
                          seal={verseSeal(chapter, ring)}
                          label={`${book} ${chapter.chapter}:${ring.verse.verseNumber}, ${ring.kind === "learned" && ring.age >= 1 ? "needs review" : STATE[ring.kind]}`}
                          onTap={() => onTapVerse(ring)}
                        >
                          {ring.verse.verseNumber}
                        </VerseRing>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
        </section>
      ))}
    </div>
  );
}
