"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import type { BuiltPalace } from "@/types";
import { useProgressStore } from "@/store/useProgressStore";
import { chapterRoom } from "@/lib/chapterLoci";
import type { RingChapter, RingVerse } from "@/lib/verseRings";
import { BookStructureChapter } from "@/components/gamification/BookStructureChapter";

const NO_PALACES: BuiltPalace[] = [];

interface BookChaptersListProps {
  chapters: RingChapter[];
  // A chapter shown open, with its sections and verses; any other is one line.
  isOpen: (chapter: RingChapter) => boolean;
  onOpenChapter: (chapter: number) => void;
  onTapVerse: (verse: RingVerse) => void;
}

// A whole book on one page (the Path tab's and Memorized tab's book views): each chapter you've
// started, under its heading, with its sections in the left column and their verses in small boxes
// beside them; every other chapter a single line that opens it, and a run of them one line that lists them.
export function BookChaptersList({ chapters, isOpen, onOpenChapter, onTapVerse }: BookChaptersListProps) {
  const [listed, setListed] = useState<Set<number>>(new Set());
  const palaces = useProgressStore((state) => state.builtPalaces) ?? NO_PALACES;
  const shut = (chapter: RingChapter) => !isOpen(chapter) || !chapter.passages.length;
  // Runs of two or more closed chapters, by their first chapter: the run's last chapter.
  const runs = new Map<number, number>();
  for (let at = 0; at < chapters.length; at++) {
    if (!shut(chapters[at]) || (at > 0 && shut(chapters[at - 1]))) continue;
    let end = at;
    while (end + 1 < chapters.length && shut(chapters[end + 1])) end++;
    if (end > at) runs.set(chapters[at].chapter, chapters[end].chapter);
  }
  // Chapters inside a run that's still one line.
  const folded = new Set<number>();
  for (const [start, end] of runs) if (!listed.has(start)) for (let chapter = start + 1; chapter <= end; chapter++) folded.add(chapter);
  return (
    <div className="flex flex-col">
      {chapters.map((chapter) => {
        if (folded.has(chapter.chapter)) return null;
        const runEnd = runs.get(chapter.chapter);
        if (runEnd !== undefined && !listed.has(chapter.chapter)) {
          return (
            <button key={chapter.chapter} type="button" onClick={() => setListed((prev) => new Set(prev).add(chapter.chapter))} className="grid min-h-9 grid-cols-[96px_minmax(0,1fr)] items-center gap-x-3 border-t border-sand-200 text-left dark:border-zinc-900">
              <span className="whitespace-nowrap text-[13px] font-bold text-sand-700 dark:text-zinc-400">
                Chapters {chapter.chapter}–{runEnd}
              </span>
              <span className="text-[11px] font-bold text-sand-600 dark:text-zinc-500">Show all {runEnd - chapter.chapter + 1}</span>
            </button>
          );
        }
        const total = chapter.total || chapter.passages.reduce((sum, passage) => sum + passage.verses.length, 0);
        const counts = chapter.known ? `${chapter.known} of ${total || "?"} verses` : total ? `${total} verses` : "";
        if (shut(chapter)) {
          return (
            <button key={chapter.chapter} type="button" onClick={() => onOpenChapter(chapter.chapter)} className="grid min-h-9 grid-cols-[96px_minmax(0,1fr)] items-center gap-x-3 border-t border-sand-200 text-left dark:border-zinc-900">
              <span className="text-[13px] font-bold text-sand-700 dark:text-zinc-400">Chapter {chapter.chapter}</span>
              <span className="text-[11px] font-bold text-sand-600 dark:text-zinc-500">{counts}</span>
            </button>
          );
        }
        return (
          <section key={chapter.chapter} className="flex flex-col pb-2">
            <button type="button" onClick={() => onOpenChapter(chapter.chapter)} className="flex min-h-11 items-center gap-2 border-t-2 border-sand-300 pt-1 text-left dark:border-zinc-800">
              <span className="font-heading text-[19px] leading-tight text-ink dark:text-zinc-100">
                Chapter {chapter.chapter}
                {chapterRoom(palaces, chapter.book, chapter.chapter) ? ` · ${chapterRoom(palaces, chapter.book, chapter.chapter)?.room.name}` : ""}
              </span>
              <span className="flex-1 text-xs font-bold text-ink-muted">{counts}</span>
              <ChevronRight size={18} strokeWidth={2.75} className="text-sand-500" />
            </button>
            <BookStructureChapter chapter={chapter} onTapVerse={onTapVerse} compact />
          </section>
        );
      })}
    </div>
  );
}
