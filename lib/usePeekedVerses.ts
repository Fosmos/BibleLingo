"use client";

import { useRef } from "react";
import type { VerseSegment } from "@/types";
import { useProgressStore } from "@/store/useProgressStore";
import { flagPeekedVerse } from "@/lib/flagPeekedVerse";
import { verseKey } from "@/lib/verseKey";

interface PeekedVerses {
  // The reader opened View First Letters or View Verse on this verse: flag it a problem verse.
  peek: (verse: VerseSegment) => void;
  // The review is done: every verse in it recalled without a peek comes off Problem Verses.
  settle: (verses: VerseSegment[]) => void;
}

const keyOf = (verse: VerseSegment) => verseKey(verse.book, verse.chapter, verse.verseNumber);

// One review's peeks, so a problem verse (lib/flagPeekedVerse.ts) clears the next time the
// reader gets through it without a hint — the list and the map's orange marks only ever show
// verses still giving trouble.
export function usePeekedVerses(): PeekedVerses {
  const peeked = useRef(new Set<string>());
  return {
    peek: (verse) => {
      peeked.current.add(keyOf(verse));
      flagPeekedVerse(verse);
    },
    settle: (verses) => {
      const { problemVerses, clearProblemVerse } = useProgressStore.getState();
      for (const verse of verses) {
        if (!peeked.current.has(keyOf(verse)) && keyOf(verse) in problemVerses) clearProblemVerse(verse.book, verse.chapter, verse.verseNumber);
      }
    },
  };
}
