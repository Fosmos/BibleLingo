"use client";

import { chapterFill, chapterSeal, type RingChapter } from "@/lib/verseRings";
import { VerseRing } from "@/components/gamification/VerseRing";

interface BookStructureBookProps {
  chapters: RingChapter[];
  // The book's themes, for the margin; a book without them is one group.
  themes: { label: string; startChapter: number; endChapter: number }[];
  onOpen: (chapter: number) => void;
  // Five smaller boxes to a row, for the Memorized tab.
  dense?: boolean;
}

// The Palace tab's whole book: its themes in the margin, its chapters as boxes beside them. A
// chapter's box fills green as it's memorized, with an orange dot when a verse in it is due and a blue outline if today's verses are in it.
export function BookStructureBook({ chapters, themes, onOpen, dense = false }: BookStructureBookProps) {
  const groups = themes.length ? themes : [{ label: "Chapters", startChapter: chapters[0]?.chapter ?? 1, endChapter: chapters[chapters.length - 1]?.chapter ?? 1 }];
  return (
    <div className="flex flex-col">
      {groups.map((group) => {
        const within = chapters.filter((chapter) => chapter.chapter >= group.startChapter && chapter.chapter <= group.endChapter);
        if (!within.length) return null;
        return (
          <section key={group.label} className={`grid gap-x-3 ${dense ? "grid-cols-[104px_minmax(0,1fr)]" : "grid-cols-[112px_minmax(0,1fr)]"} border-t border-sand-200 py-3.5 dark:border-zinc-900`}>
            <div className="flex flex-col gap-0.5">
              <h2 className="text-sm font-extrabold leading-tight text-ink dark:text-zinc-100">{group.label}</h2>
              <span className="text-xs font-bold text-ink-muted">Chapters {group.startChapter}–{group.endChapter}</span>
            </div>
            <div className={`grid content-start gap-1 ${dense ? "grid-cols-5" : "grid-cols-4"}`}>
              {within.map((chapter) => {
                const due = (chapter.age ?? 0) >= 1;
                const kind = chapter.hasToday ? "today" : chapter.age !== undefined ? "learned" : "new";
                return (
                  <VerseRing key={chapter.chapter} size={dense ? "dense" : "chapter"} kind={kind} age={chapter.age ?? 0} seal={chapterSeal(chapter)} fill={chapter.age !== undefined ? chapterFill(chapter) : undefined} due={due} label={`Open chapter ${chapter.chapter}, ${chapter.known} ${chapter.known === 1 ? "verse" : "verses"} learned${due ? ", review due" : ""}`} onTap={() => onOpen(chapter.chapter)}>
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
