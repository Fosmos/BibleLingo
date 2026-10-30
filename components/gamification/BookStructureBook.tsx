"use client";

import type { RingChapter } from "@/lib/verseRings";
import { VerseRing } from "@/components/gamification/VerseRing";

interface BookStructureBookProps {
  chapters: RingChapter[];
  // The book's themes, for the margin; a book without them is one group.
  themes: { label: string; startChapter: number; endChapter: number }[];
  onOpen: (chapter: number) => void;
}

// The Palace tab's whole book: its themes in the margin, its chapters as boxes beside them. A
// chapter's box shows its most urgent verse, or a blue outline if today's verses are in it.
export function BookStructureBook({ chapters, themes, onOpen }: BookStructureBookProps) {
  const groups = themes.length ? themes : [{ label: "Chapters", startChapter: chapters[0]?.chapter ?? 1, endChapter: chapters[chapters.length - 1]?.chapter ?? 1 }];
  return (
    <div className="flex flex-col">
      {groups.map((group) => {
        const within = chapters.filter((chapter) => chapter.chapter >= group.startChapter && chapter.chapter <= group.endChapter);
        if (!within.length) return null;
        return (
          <section key={group.label} className="grid grid-cols-[112px_minmax(0,1fr)] gap-x-3 border-t border-sand-200 py-3.5 dark:border-zinc-900">
            <div className="flex flex-col gap-0.5">
              <h2 className="text-sm font-extrabold leading-tight text-ink dark:text-zinc-100">{group.label}</h2>
              <span className="text-xs font-bold text-ink-muted">Chapters {group.startChapter}–{group.endChapter}</span>
            </div>
            <div className="grid content-start grid-cols-4 gap-1">
              {within.map((chapter) => {
                const kind = chapter.hasToday ? "today" : chapter.age !== undefined ? "learned" : "new";
                return (
                  <VerseRing key={chapter.chapter} size="chapter" kind={kind} age={chapter.age ?? 0} label={`Open chapter ${chapter.chapter}, ${chapter.known} of ${chapter.total} verses`} onTap={() => onOpen(chapter.chapter)}>
                    {chapter.chapter}
                  </VerseRing>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
