"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";
import { adjacentChapter, type ChapterRef } from "@/lib/adjacentChapter";

const LOAD_WITHIN_PX = 900;
const sameChapter = (a: ChapterRef, b: ChapterRef) => a.book === b.book && a.chapter === b.chapter;

// The chapter reader as one continuous scroll: starting from one chapter, the next is added below
// as you near the end and the previous above as you scroll up (Titus 3 runs on into Philemon 1).
// Whatever verse is at the top of the screen stays put while chapters load in or text re-lays out
// around it (measured and restored by hand — Safari has no CSS scroll anchoring). Paused while a
// lesson runs, which moves the view itself.
// `isLoaded`: whether a chapter's text is in — the next one is only added at an end once the one
// there has loaded, so a chapter still loading never has another stacked past it.
export function useContinuousChapters(
  start: ChapterRef,
  scrollRef: RefObject<HTMLDivElement | null>,
  contentRef: RefObject<HTMLDivElement | null>,
  enabled: boolean,
  isLoaded: (at: ChapterRef) => boolean,
) {
  const [chapters, setChapters] = useState<ChapterRef[]>([start]);
  const [inView, setInView] = useState<ChapterRef>(start);
  const anchor = useRef<{ key: string; top: number } | null>(null);
  const interacted = useRef(false);
  // Set while a scroll is our own correction, so it isn't mistaken for the reader moving.
  const correcting = useRef(false);

  const firstVisibleRow = useCallback(() => {
    const scroller = scrollRef.current;
    if (!scroller) return null;
    const top = scroller.getBoundingClientRect().top;
    const rows = scroller.querySelectorAll<HTMLElement>("[data-verse-key]");
    for (const row of rows) if (row.getBoundingClientRect().bottom > top + 8) return { row, top };
    return null;
  }, [scrollRef]);

  const recordAnchor = useCallback(() => {
    const found = firstVisibleRow();
    if (!found) return;
    const key = found.row.dataset.verseKey ?? "";
    anchor.current = { key, top: found.row.getBoundingClientRect().top - found.top };
    const [book, chapter] = key.split("|");
    setInView((prev) => (prev.book === book && prev.chapter === Number(chapter) ? prev : { book, chapter: Number(chapter) }));
  }, [firstVisibleRow]);

  // Content above the anchored verse grew or shrank (a chapter loaded in above, lines re-fitted):
  // scroll by the difference so that verse doesn't move.
  const hold = useCallback(() => {
    const scroller = scrollRef.current;
    const held = anchor.current;
    if (!scroller || !enabled || !held) return;
    const row = scroller.querySelector<HTMLElement>(`[data-verse-key="${CSS.escape(held.key)}"]`);
    if (!row) return;
    const drift = row.getBoundingClientRect().top - scroller.getBoundingClientRect().top - held.top;
    if (Math.abs(drift) <= 1) return;
    correcting.current = true;
    scroller.scrollTop += drift;
  }, [scrollRef, enabled]);
  // Straight after a chapter is added, before the screen paints.
  useLayoutEffect(hold, [chapters, hold]);

  useEffect(() => {
    const content = contentRef.current;
    const scroller = scrollRef.current;
    if (!content || !scroller) return;
    const observer = new ResizeObserver(hold);
    observer.observe(content);
    const mark = () => (interacted.current = true);
    scroller.addEventListener("touchstart", mark, { passive: true });
    scroller.addEventListener("wheel", mark, { passive: true });
    return () => {
      observer.disconnect();
      scroller.removeEventListener("touchstart", mark);
      scroller.removeEventListener("wheel", mark);
    };
  }, [contentRef, scrollRef, hold]);

  const onScroll = useCallback(() => {
    const scroller = scrollRef.current;
    if (!scroller) return;
    if (correcting.current) {
      correcting.current = false;
      return;
    }
    recordAnchor();
    if (!enabled) return;
    if (scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight < LOAD_WITHIN_PX) {
      setChapters((list) => {
        const last = list[list.length - 1];
        const next = isLoaded(last) ? adjacentChapter(last.book, last.chapter, 1) : null;
        return next ? [...list, next] : list;
      });
    }
    if (interacted.current && scroller.scrollTop < LOAD_WITHIN_PX) {
      setChapters((list) => {
        const prev = isLoaded(list[0]) ? adjacentChapter(list[0].book, list[0].chapter, -1) : null;
        return prev ? [prev, ...list] : list;
      });
    }
  }, [scrollRef, recordAnchor, enabled, isLoaded]);

  // Make sure a chapter is in the list (a lesson moving on into it): next to an end, it's added
  // there; anywhere else, the list starts over from it.
  const ensure = useCallback((target: ChapterRef) => {
    setChapters((list) => {
      if (list.some((entry) => sameChapter(entry, target))) return list;
      const last = list[list.length - 1];
      const after = adjacentChapter(last.book, last.chapter, 1);
      if (after && sameChapter(after, target)) return [...list, target];
      const before = adjacentChapter(list[0].book, list[0].chapter, -1);
      if (before && sameChapter(before, target)) return [target, ...list];
      return [target];
    });
  }, []);

  return { chapters, inView, onScroll, ensure };
}
