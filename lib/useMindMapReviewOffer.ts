"use client";

import { useState } from "react";
import { useProgressStore } from "@/store/useProgressStore";
import type { MemorizationDay } from "@/types";
import { chapterReviewOffer, verseReviewOffer, type SrsReviewOffer } from "@/lib/srsReviewOffer";
import { lessonRangeOf } from "@/lib/lessonRange";

interface MindMapReviewOffer {
  offer: SrsReviewOffer | null;
  // Each shows the review tab (MindMapReviewTab.tsx) when the tap has a review to offer, and
  // says whether it did — so the caller skips whatever the tap would otherwise have done.
  offerVerse: (book: string, chapter: number, verseNumber: number) => boolean;
  offerChapter: (book: string, chapter: number) => boolean;
  clear: () => void;
}

// The Mind Map's review-on-tap: a verse due for review, or any chapter with memorized verses
// (early, if none are due), offers its review (see lib/srsReviewOffer.ts). `days` are the drawn
// path's lessons, so a verse's relearn can cover the whole lesson it was learned in.
export function useMindMapReviewOffer(days: MemorizationDay[]): MindMapReviewOffer {
  const [offer, setOffer] = useState<SrsReviewOffer | null>(null);
  const show = (next: SrsReviewOffer | null) => {
    setOffer(next);
    return next !== null;
  };
  return {
    offer,
    offerVerse: (book, chapter, verseNumber) =>
      show(verseReviewOffer(useProgressStore.getState().memorizedEntities, book, chapter, verseNumber, lessonRangeOf(days, book, chapter, verseNumber))),
    offerChapter: (book, chapter) => show(chapterReviewOffer(useProgressStore.getState().memorizedEntities, book, chapter)),
    clear: () => setOffer(null),
  };
}
