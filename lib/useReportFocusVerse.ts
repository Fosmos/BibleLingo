"use client";

import { useCallback } from "react";
import type { VerseSegment } from "@/types";
import { useLessonSessionStore } from "@/store/useLessonSessionStore";

// A ReviewChain `onVerseChange` for review stages inside the Mind Map sheet — reports each
// verse as the reader reaches it to store/useLessonSessionStore.ts's `focusVerse`, so the real
// canvas above glides from chip to chip (see lib/useMindMapVerseFocusLock.ts). Undefined outside
// the sheet, where there's no canvas to follow along.
export function useReportFocusVerse(embeddedInMindMap: boolean | undefined): ((verse: VerseSegment) => void) | undefined {
  const setFocusVerse = useLessonSessionStore((state) => state.setFocusVerse);
  const report = useCallback(
    (verse: VerseSegment) => setFocusVerse({ book: verse.book, chapter: verse.chapter, verseNumber: verse.verseNumber }),
    [setFocusVerse],
  );
  return embeddedInMindMap ? report : undefined;
}
