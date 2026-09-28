"use client";

import { useEffect, type Dispatch, type SetStateAction } from "react";
import type { MindMapRootDatum } from "@/lib/mindMapHierarchy";
import { findAncestorPath } from "@/lib/mindMapActivePath";

interface UseMindMapFollowFocusBranchArgs {
  focusVerse: { book?: string; chapter: number; verseNumber: number } | undefined;
  tree: MindMapRootDatum;
  activePath: string[];
  setActivePath: Dispatch<SetStateAction<string[]>>;
}

// Opens whichever chapter holds the sheet's focused verse, so its verse chips are laid out for
// lib/useMindMapVerseFocusLock.ts to frame — an SRS review run (InPlaceSrsReview.tsx) moves on to
// ranges in other chapters, even other books. A chapter of a book that isn't open yet takes two
// passes: open the book first (which starts its on-demand fetch, see
// lib/useMindMapBrowseChapter.ts), then its chapter once that lands in the tree. A no-op while
// the focused chapter is already the open one — the everyday in-lesson case.
export function useMindMapFollowFocusBranch({ focusVerse, tree, activePath, setActivePath }: UseMindMapFollowFocusBranchArgs): void {
  const book = focusVerse?.book;
  const chapter = focusVerse?.chapter;
  useEffect(() => {
    if (!book || chapter === undefined) return;
    const chapterId = `chapter:${book}:${chapter}`;
    if (activePath[activePath.length - 1] === chapterId) return;
    const target = findAncestorPath(tree, chapterId) ?? findAncestorPath(tree, `book:${book}`);
    if (!target || target[target.length - 1] === activePath[activePath.length - 1]) return;
    setActivePath(target);
  }, [book, chapter, tree, activePath, setActivePath]);
}
