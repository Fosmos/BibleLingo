"use client";

import { useState } from "react";

// 0 — the whole Bible; 1 — one book's chapters; 2 — one chapter's reader.
export type ZoomLevel = 0 | 1 | 2;

export interface BiblePlace {
  book: string;
  chapter: number;
}

// The Path tab's three levels (design_handoff_bible_progress) and where you are in them. Opens on
// the chapter reader; the breadcrumbs step back out to the book or the whole Bible.
export function useBibleZoom(start: BiblePlace, startLevel: ZoomLevel = 2) {
  const [level, setLevel] = useState<ZoomLevel>(startLevel);
  const [place, setPlace] = useState<BiblePlace>(start);

  function openBook(book: string) {
    setPlace((prev) => ({ book, chapter: prev.book === book ? prev.chapter : 1 }));
    setLevel(1);
  }

  function openChapter(book: string, chapter: number) {
    setPlace({ book, chapter });
    setLevel(2);
  }

  return { level, place, openBook, openChapter, toBible: () => setLevel(0), toBook: () => setLevel(1) };
}
