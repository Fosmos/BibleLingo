"use client";

import { useEffect, useRef } from "react";
import { useProgressStore } from "@/store/useProgressStore";
import { useLessonSessionStore } from "@/store/useLessonSessionStore";

// The link Home's Needs Reviewing box gives each due range (NeedsReviewingCard.tsx):
// `?review=<entity id>` on the path's Mind Map.
export function reviewArrivalHref(pathKey: string, version: string, entityId: string): string {
  return `/path/${encodeURIComponent(pathKey)}?version=${encodeURIComponent(version)}&review=${encodeURIComponent(entityId)}`;
}

// Arriving by that link, once: the map flies to the range's first verse (lib/useMindMapArrival.ts)
// and shows its review tab (MindMapReviewTab.tsx) — `offerVerse` is BookMindMapWithLessonSheet's.
export function useReviewArrival(offerVerse: (book: string, chapter: number, verseNumber: number) => boolean): void {
  const setArrival = useLessonSessionStore((state) => state.setArrivalVerse);
  const doneRef = useRef(false);
  useEffect(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    const id = new URLSearchParams(window.location.search).get("review");
    const entity = id ? useProgressStore.getState().memorizedEntities.find((candidate) => candidate.id === id) : undefined;
    if (!entity) return;
    setArrival({ book: entity.book, chapter: entity.chapter, verseNumber: entity.startVerse });
    offerVerse(entity.book, entity.chapter, entity.startVerse);
  }, [offerVerse, setArrival]);
}
