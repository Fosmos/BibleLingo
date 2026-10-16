"use client";

import { useEffect } from "react";
import { useLessonSessionStore } from "@/store/useLessonSessionStore";

// Tells the lesson page's Letters / Verse tabs (DrillHelpChips.tsx) which verse is on screen —
// the whole verse the verse zone shows (LessonPageCard.tsx) — while `text` is set.
export function usePublishHelpVerse(text: string | null): void {
  const setHelpVerseText = useLessonSessionStore((state) => state.setHelpVerseText);
  useEffect(() => {
    if (!text) return;
    setHelpVerseText(text);
    return () => setHelpVerseText(null);
  }, [text, setHelpVerseText]);
}
