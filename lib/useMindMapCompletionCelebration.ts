"use client";

import { useEffect, useState } from "react";
import type { MindMapLayout } from "@/lib/mindMapTreeLayout";
import { useProgressStore } from "@/store/useProgressStore";
import { playSectionCompleteSfx, playBookCompleteSfx } from "@/lib/audio";

const CELEBRATION_DISPLAY_MS = 1000;

interface CelebrationEntry {
  id: string;
  kind: "chapter" | "book";
}

export interface MindMapCompletion {
  // The one chapter currently mid-celebration, or null — see MindMapNodeCard.tsx's chapter
  // branch (`celebrating` prop) for the chime + scoped confetti + badge pop this drives.
  celebratingChapterId: string | null;
  // Same, for a whole BOOK just finishing — a bigger, separate celebration tier (see
  // playBookCompleteSfx), fired on that book's own ring node.
  celebratingBookId: string | null;
}

// Fires the Mind Map's own one-time "you finished this" celebration — chapter tier (chime +
// scoped confetti + badge pop) or the grander book tier (a richer chime + bigger confetti) — the
// first time any chapter/book in the current layout reads as fully complete. Deliberately its OWN
// small persisted dedup arrays (types/index.ts's celebratedMindMapChapters/celebratedMindMapBooks),
// not the shared `stickers`/StickerBook pipeline — that one is modeled as "one entry per
// completed PATH," and a 16-chapter book would spam 16 unrelated entries into that screen.
export function useMindMapCompletionCelebration(layout: MindMapLayout): MindMapCompletion {
  const celebratedChapters = useProgressStore((state) => state.celebratedMindMapChapters);
  const celebratedBooks = useProgressStore((state) => state.celebratedMindMapBooks);
  const markChapterCelebrated = useProgressStore((state) => state.markMindMapChapterCelebrated);
  const markBookCelebrated = useProgressStore((state) => state.markMindMapBookCelebrated);
  // Queued rather than shown all at once — a rare simultaneous multi-completion (e.g. right
  // after a fresh progress load) still gets each its own visible moment, one after another,
  // instead of silently dropping every one but the first.
  const [queue, setQueue] = useState<CelebrationEntry[]>([]);
  // The last computed key this hook has already reacted to — compared against the freshly-
  // computed one below on every render, same "adjust state during render when a computed value
  // changes" convention BookMindMap.tsx's own `expandedResetKey` already uses, rather than a
  // useEffect (which a linter flags here as deriving state from other state).
  const [seenKey, setSeenKey] = useState("");

  const newEntries: CelebrationEntry[] = [
    ...layout.nodes
      .filter((node) => node.data.kind === "chapter" && node.data.status === "completed" && !celebratedChapters.includes(node.data.id))
      .map((node): CelebrationEntry => ({ id: node.data.id, kind: "chapter" })),
    ...layout.nodes
      .filter((node) => node.data.kind === "book" && node.data.percent >= 100 && !celebratedBooks.includes(node.data.id))
      .map((node): CelebrationEntry => ({ id: node.data.id, kind: "book" })),
  ];
  const newKey = newEntries.map((entry) => `${entry.kind}:${entry.id}`).join(",");

  if (newKey !== seenKey && newEntries.length > 0) {
    setSeenKey(newKey);
    setQueue(newEntries);
    // Marked celebrated immediately (not after the queue drains) — see
    // markMindMapChapterCelebrated's own doc comment for why.
    for (const entry of newEntries) (entry.kind === "chapter" ? markChapterCelebrated : markBookCelebrated)(entry.id);
  }

  useEffect(() => {
    if (queue.length === 0) return;
    (queue[0].kind === "book" ? playBookCompleteSfx : playSectionCompleteSfx)();
    const timeout = setTimeout(() => setQueue((prev) => prev.slice(1)), CELEBRATION_DISPLAY_MS);
    return () => clearTimeout(timeout);
  }, [queue]);

  const current = queue[0];
  return {
    celebratingChapterId: current?.kind === "chapter" ? current.id : null,
    celebratingBookId: current?.kind === "book" ? current.id : null,
  };
}
