"use client";

import { useEffect, useState } from "react";
import type { VerseSegment } from "@/types";
import { ensureChapterLoaded } from "@/lib/bibleApiClient";
import { useProgressStore } from "@/store/useProgressStore";
import { pathTargetLabel, type PathTarget } from "@/lib/mindMapPathTarget";
import { MindMapVersePreview } from "@/components/gamification/MindMapVersePreview";

interface MindMapVerseTargetPreviewProps {
  // A verse tapped OUTSIDE the reader's active paths.
  target: Extract<PathTarget, { kind: "verse" }>;
  // Translation to show it in — the active path's, or the picker's default.
  version: string;
  // Opens its path setup (see MindMapPathSetup.tsx).
  onMemorize: () => void;
}

// What tapping a verse outside the active paths opens: the verse itself, in its sense lines, in
// the same sheet a verse inside the path previews in (MindMapVersePreview.tsx) — read it first,
// then "Memorize" it. Its chapter is usually already cached from browsing to it on the map; if
// not, it's fetched here.
export function MindMapVerseTargetPreview({ target, version, onMemorize }: MindMapVerseTargetPreviewProps) {
  const [loaded, setLoaded] = useState<{ key: string; verse: VerseSegment | undefined } | null>(null);
  const key = `${target.book}|${target.chapter}|${target.verse}|${version}`;
  // Already memorized (in spaced review, from any path): shown as done, not offered again.
  const memorized = useProgressStore((state) =>
    state.memorizedEntities.some((entity) => entity.book === target.book && entity.chapter === target.chapter && target.verse >= entity.startVerse && target.verse <= entity.endVerse),
  );

  useEffect(() => {
    let cancelled = false;
    ensureChapterLoaded(target.book, target.chapter, version)
      .then((verses) => {
        if (!cancelled) setLoaded({ key, verse: verses.find((verse) => verse.verseNumber === target.verse) });
      })
      .catch(() => {
        if (!cancelled) setLoaded({ key, verse: undefined });
      });
    return () => {
      cancelled = true;
    };
  }, [key, target.book, target.chapter, target.verse, version]);

  const verse = loaded?.key === key ? loaded.verse : undefined;
  if (memorized) {
    return <MindMapVersePreview verse={verse} learned actionLabel={undefined} onAction={() => {}} status="Memorized — in your review" secondary={{ label: "Memorize again", onClick: onMemorize }} />;
  }
  return <MindMapVersePreview verse={verse} learned={false} actionLabel={`Memorize ${pathTargetLabel(target)}`} onAction={onMemorize} />;
}
