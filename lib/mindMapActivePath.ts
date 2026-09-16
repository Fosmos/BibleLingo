import type { MindMapDatum, MindMapRootDatum } from "@/lib/mindMapHierarchy";
import type { ChapterNode } from "@/lib/useMindMapData";
import { findBook } from "@/lib/bibleBooks";
import { BOOK_THEMES } from "@/lib/bookThemes";
import { bookGenre, bookSubgenre } from "@/lib/canonTree";

// A node's own real children per lib/mindMapHierarchy.ts's own union — mirrors the identical
// helper in lib/mindMapTreeLayout.ts (a pericope never has any); kept as its own copy rather than
// a shared import since this file and that one walk the tree for two genuinely different
// reasons (layout position vs. accordion state) that happen to need the same one-line rule.
function childrenOf(datum: MindMapDatum): MindMapDatum[] {
  return datum.kind === "pericope" ? [] : datum.children;
}

// Contextual Accordion Focus-Dimming (CAFD): the whole canvas has exactly ONE open branch at a
// time, enforced at EVERY level (not just the leaf/pericope ring) — opening a node anywhere in
// the tree collapses whatever sibling used to be open at that same depth, and every depth above
// and below it too, since the open branch is always a single unbroken path from root to whatever
// was tapped last. `activePath` is that path's own ids, in order, root's own direct children
// first — never including "root" itself (root has no sibling to be exclusive against, and is
// always implicitly on-screen). See BookMindMap.tsx's own doc comment for why this replaced a
// plain expandedIds Set.

// Depth-first search for `targetId` among `root`'s descendants, returning every ancestor id from
// just under the root down to and including targetId itself. Null when targetId isn't anywhere
// in the tree (shouldn't normally happen — a tap always comes from a currently-rendered node —
// but state built against a stale tree, e.g. the instant after switching books, is exactly the
// kind of gap this guards against rather than silently mis-toggling).
export function findAncestorPath(root: MindMapRootDatum, targetId: string): string[] | null {
  function walk(datum: MindMapDatum, trail: string[]): string[] | null {
    if (datum.id === targetId) return trail;
    for (const child of childrenOf(datum)) {
      const found = walk(child, [...trail, child.id]);
      if (found) return found;
    }
    return null;
  }
  return walk(root, []);
}

// Every node's own immediate parent id, root's own direct children included (mapped to "root")
// — BookMindMap.tsx's own re-centering effect needs this to find "whichever row is currently the
// open branch's own frontier" (the deepest active node's real children), which a plain
// ancestor-path lookup alone can't answer without walking the tree again per candidate node.
export function buildParentMap(root: MindMapRootDatum): Map<string, string> {
  const parents = new Map<string, string>();
  function walk(datum: MindMapDatum) {
    for (const child of childrenOf(datum)) {
      parents.set(child.id, datum.id);
      walk(child);
    }
  }
  walk(root);
  return parents;
}

// One tap's own effect on the single active branch. Tapping a node already ON the path COLLAPSES
// it — and, since the path is one unbroken chain, everything below it too — by trimming the path
// back to just its own parent. Tapping anything else (a sibling at the same level, a totally
// different branch, a deeper node reached through an already-open ancestor) REPLACES the whole
// path with that node's own real ancestor chain, discarding whatever was open at every level
// along the way, even ones unrelated to targetId's own ancestry — that full replacement, not a
// per-level patch, is what "exclusive at every level" actually means. Returns the SAME
// `currentPath` reference when targetId isn't found in the tree, so a caller relying on
// referential equality (e.g. a React state setter) doesn't fire a re-render for a no-op tap.
export function toggleActivePath(root: MindMapRootDatum, currentPath: string[], targetId: string): string[] {
  const index = currentPath.indexOf(targetId);
  if (index !== -1) return currentPath.slice(0, index);
  const path = findAncestorPath(root, targetId);
  return path ?? currentPath;
}

// The default-open single branch down to today's own lesson — the testament and genre the
// active book lives in, the book itself, whichever Theme (see lib/bookThemes.ts) today's chapter
// falls under (if this book has any), and today's own active chapter — in that top-down order,
// exactly the shape `activePath` above expects. Only the FIRST (lowest-numbered) active chapter
// makes the cut when more than one happens to carry "active" status — CAFD's own strict single-
// branch rule means two siblings can never both start open, even by default; every other active
// chapter is still one tap away, just not pre-opened. Every OTHER branch of the whole canon (the
// other testament, every other genre, every other book, every other theme/chapter) starts
// collapsed to its own single circle, which is what keeps the very first paint from being the
// entire Bible's worth of circles at once.
export function defaultActivePath(bookLabel: string, chapters: ChapterNode[]): string[] {
  const book = findBook(bookLabel);
  const path: string[] = [];
  if (book) {
    const genre = bookGenre(book);
    path.push(`testament:${book.testament}`, `genre:${book.testament}:${genre}`);
    const subgenre = bookSubgenre(book);
    if (subgenre) path.push(`subgenre:${book.testament}:${genre}:${subgenre}`);
  }
  path.push(`book:${bookLabel}`);
  const activeChapterNumbers = chapters
    .filter((chapter) => chapter.status === "active")
    .map((chapter) => chapter.chapter)
    .sort((a, b) => a - b);
  const themes = BOOK_THEMES[bookLabel];
  if (themes) {
    const theme = themes.find((theme) => activeChapterNumbers.some((chapterNumber) => chapterNumber >= theme.startChapter && chapterNumber <= theme.endChapter));
    if (theme) path.push(`theme:${bookLabel}:${theme.id}`);
  }
  if (activeChapterNumbers.length > 0) path.push(`chapter:${bookLabel}:${activeChapterNumbers[0]}`);
  return path;
}

// Every id on the path from root down to whichever pericope or (pericope-less) chapter is
// literally TODAY's own lesson — not just the single currently-open UI branch (`activePath`
// above, which the reader controls by tapping). Used to force the "active" amber/yellow read
// (see MindMapNodeCard.tsx's own STATUS_CLASS/RING_STATUS_CLASS) up through every ancestor ring
// too — Testament, Genre, Subgenre, Book, Theme — not just the leaf that already carries it via
// its own real PericopeCardStatus, so the reader can always see, at a glance and from anywhere
// on the canvas, which whole branch actually contains today's real memorization work, even while
// it's still collapsed. Only ever real for the currently ACTIVE book's own descendants — a
// browsed (non-active) book's own chapters/pericopes never carry status "active" (see
// lib/mindMapBrowseTree.ts), so this never lights up anywhere else.
export function activeChainIds(root: MindMapRootDatum): Set<string> {
  const ids = new Set<string>();
  function walk(datum: MindMapDatum, ancestors: string[]) {
    const isActiveLeaf = (datum.kind === "pericope" || datum.kind === "chapter") && datum.status === "active";
    if (isActiveLeaf) {
      for (const id of ancestors) ids.add(id);
      ids.add(datum.id);
    }
    const childAncestors = datum.kind === "root" ? ancestors : [...ancestors, datum.id];
    for (const child of childrenOf(datum)) walk(child, childAncestors);
  }
  walk(root, []);
  return ids;
}

// Which OTHER (non-active) book's own chapter ring `activePath` currently has open, if any —
// CAFD's single-open-branch rule means there's ever at most one (see BookMindMap.tsx's own
// browse support, lib/mindMapBrowseTree.ts). Null when nothing but the real active book is open,
// which already gets its real data for free via lib/useMindMapData.ts.
export function findBrowsedBook(activePath: string[], activeBookName: string): string | null {
  const bookId = activePath.find((id) => id.startsWith("book:"));
  if (!bookId) return null;
  const name = bookId.slice("book:".length);
  return name === activeBookName ? null : name;
}

// Which chapter of `browsedBookName` is currently open, if any — the one chapter
// lib/useMindMapBrowseChapter.ts actually needs to fetch pericopes for.
export function findBrowsedChapter(activePath: string[], browsedBookName: string | null): number | undefined {
  if (!browsedBookName) return undefined;
  const prefix = `chapter:${browsedBookName}:`;
  const chapterId = activePath.find((id) => id.startsWith(prefix));
  if (!chapterId) return undefined;
  const chapter = Number(chapterId.slice(prefix.length));
  return Number.isFinite(chapter) ? chapter : undefined;
}
