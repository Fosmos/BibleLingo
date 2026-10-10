"use client";

import { useState } from "react";

// 0 — the shelves; 1 — a chapter's pericope cards.
export type ZoomLevel = 0 | 1;

export interface BiblePlace {
  book: string;
  chapter: number;
}

// The Path tab's two levels (shelf_path): where you are, and which book's chapter drawer is pulled
// out on the shelves. Opens on the chapter; backing out keeps that book's drawer open.
export function useBibleZoom(start: BiblePlace) {
  const [level, setLevel] = useState<ZoomLevel>(1);
  const [place, setPlace] = useState<BiblePlace>(start);
  const [openBook, setOpenBook] = useState<string | null>(start.book || null);

  function openChapter(book: string, chapter: number) {
    setPlace({ book, chapter });
    setOpenBook(book);
    setLevel(1);
  }

  function toShelves() {
    setOpenBook(place.book);
    setLevel(0);
  }

  return { level, place, openBook, setOpenBook, openChapter, toShelves };
}
