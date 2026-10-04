"use client";

import { useEffect, useRef } from "react";
import { useProgressStore } from "@/store/useProgressStore";
import { useLessonSessionStore } from "@/store/useLessonSessionStore";

// Links from Home's Needs reviewing box (NeedsReviewingCard.tsx) onto the path's Mind Map:
// `?review=<id>[,<id>…]`, plus `&start=1` to begin reviewing those ranges straight away (a row
// tap, "Review all") rather than just landing on the first one with its review tab (the row's map pin).
export function reviewArrivalHref(pathKey: string, version: string, entityIds: string[], start: boolean): string {
  const query = new URLSearchParams({ version, review: entityIds.join(",") });
  if (start) query.set("start", "1");
  return `/path/${encodeURIComponent(pathKey)}?${query}`;
}

// Arriving by that link, once: the map flies to the first range's first verse (lib/useMindMapArrival.ts),
// then either starts the review run (`startReview`) or shows that range's review tab (`offerVerse`,
// MindMapReviewTab.tsx) — both BookMindMapWithLessonSheet's own.
export function useReviewArrival(
  offerVerse: (book: string, chapter: number, verseNumber: number) => boolean,
  startReview: (entityIds: string[]) => void,
): void {
  const setArrival = useLessonSessionStore((state) => state.setArrivalVerse);
  const doneRef = useRef(false);
  useEffect(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    const params = new URLSearchParams(window.location.search);
    const entities = useProgressStore.getState().memorizedEntities;
    const ids = (params.get("review") ?? "").split(",").filter((id) => entities.some((entity) => entity.id === id));
    const first = entities.find((entity) => entity.id === ids[0]);
    if (!first) return;
    setArrival({ book: first.book, chapter: first.chapter, verseNumber: first.startVerse });
    if (params.get("start") === "1") startReview(ids);
    else offerVerse(first.book, first.chapter, first.startVerse);
  }, [offerVerse, startReview, setArrival]);
}
