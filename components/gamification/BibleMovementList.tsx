"use client";

import { useState, type MouseEvent } from "react";
import type { BookMovement } from "@/lib/bookMovements";
import type { BibleHeld } from "@/lib/useBibleHeld";
import { useChapterThemes } from "@/lib/useChapterThemes";

interface BibleMovementListProps {
  book: string;
  movements: BookMovement[];
  pathChapter: number;
  held: BibleHeld;
  onOpen: (chapter: number, event: MouseEvent<HTMLElement>) => void;
}

// The Path tab's level 2 for a book without a wheel: its movements as rows, the one holding your
// path open. An open movement lists its chapters; tapping one goes straight to its chapter path view.
export function BibleMovementList({ book, movements, pathChapter, held, onOpen }: BibleMovementListProps) {
  const [open, setOpen] = useState(Math.max(0, movements.findIndex((movement) => movement.chapters.includes(pathChapter))));
  const themeOf = useChapterThemes(book, movements[open]?.chapters ?? []);

  return (
    <div className="flex flex-col gap-2">
      {movements.map((movement, index) => {
        const count = movement.chapters.reduce((sum, chapter) => sum + held.heldIn(book, chapter), 0);
        const here = movement.chapters.includes(pathChapter);
        const isOpen = index === open;
        return (
          <div key={movement.range} className={`overflow-hidden rounded-organic ${isOpen ? "bg-sand-100 dark:bg-zinc-900" : "border-2 border-sand-200 dark:border-zinc-800"}`}>
            <button type="button" onClick={() => setOpen(isOpen ? -1 : index)} className="flex w-full gap-3 p-3 text-left">
              <i className={`w-[5px] self-stretch rounded-full ${here ? "bg-brand-500" : count ? "bg-sage-400" : "bg-sand-200"}`} />
              <span className="flex flex-1 flex-col gap-0.5">
                <span className="text-[11px] font-extrabold uppercase tracking-[.06em] text-ink-muted">
                  {book === "Psalms" ? "Psalms" : "Chapters"} {movement.range}
                </span>
                <span className="font-heading text-[17px] text-ink dark:text-zinc-100">{movement.title}</span>
              </span>
              {count > 0 && <span className="self-start rounded-full bg-sage-200 px-2.5 py-0.5 text-xs font-bold text-sage-900">{count} held</span>}
            </button>
            {isOpen &&
              movement.chapters.map((chapter) => {
                const chapterHeld = held.heldIn(book, chapter);
                const onPath = chapter === pathChapter;
                return (
                  <button key={chapter} type="button" onClick={(event) => onOpen(chapter, event)} className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-sand-200/60 dark:hover:bg-zinc-800">
                    <span
                      className={`flex h-[38px] w-[38px] flex-none items-center justify-center rounded-full font-heading text-sm ${
                        onPath ? "bg-sage-600 text-white" : chapterHeld ? "bg-sage-200 text-sage-900" : "bg-paper text-ink-soft dark:bg-zinc-800 dark:text-zinc-300"
                      }`}
                    >
                      {chapter}
                    </span>
                    <span className="flex-1 text-sm font-semibold text-ink dark:text-zinc-100">{themeOf(chapter)}</span>
                    <span className={`text-[11px] font-extrabold ${onPath ? "text-brand-800" : "text-sage-800"}`}>{onPath ? "YOUR PATH" : chapterHeld ? `${chapterHeld} held` : ""}</span>
                  </button>
                );
              })}
          </div>
        );
      })}
    </div>
  );
}
