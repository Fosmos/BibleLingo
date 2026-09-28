import { playMindMapTapSfx } from "@/lib/audio";
import type { MindMapDatum, MindMapPericopeDatum } from "@/lib/mindMapHierarchy";
import { isCoveredByActivePath, pathTargetForDatum, type PathTarget } from "@/lib/mindMapPathTarget";

export interface MindMapSelectionHandlers {
  // A pericope inside the active path opens its own starting verse in the chapter's reading
  // view; anywhere else, it offers its chapter as a new path (see `onChoosePath`).
  onSelectPericope: (pericope: { id: string; book: string; chapter: number; startVerse?: number }) => void;
  // A verse inside the active path opens its lesson preview (the in-place sheet, falling back to
  // the chapter view); anywhere else, it offers that verse as a new path.
  onSelectVerse: (pericope: MindMapPericopeDatum, verseNumber: number) => void;
  // Called when a book/chapter ring is OPENED (not collapsed) — offers it as a new path unless
  // it's already part of the active one.
  onOpenRing: (datum: MindMapDatum) => void;
}

// BookMindMap.tsx's own tap handlers (pericope card, verse chip, ring) — split out to keep that
// file under this codebase's 200-line cap. Choosing a path is done by navigating the map itself:
// anything tapped outside the active path offers to start it (BookMindMapWithLessonSheet.tsx's
// small path tab, see MindMapPathTab.tsx).
export function buildMindMapSelectionHandlers(
  activePathKey: string | null,
  onSelectChapter: (chapter: number, startVerse?: number) => void,
  onSelectVerseForLesson: ((pericope: MindMapPericopeDatum, verseNumber: number) => void) | undefined,
  onChoosePath: (target: PathTarget) => void,
): MindMapSelectionHandlers {
  const covered = (target: PathTarget) => isCoveredByActivePath(target, activePathKey);

  function onSelectPericope(pericope: { id: string; book: string; chapter: number; startVerse?: number }) {
    playMindMapTapSfx();
    const target: PathTarget = { kind: "chapter", book: pericope.book, chapter: pericope.chapter };
    if (!covered(target)) {
      onChoosePath(target);
      return;
    }
    onSelectChapter(pericope.chapter, pericope.startVerse);
  }

  function onSelectVerse(pericope: MindMapPericopeDatum, verseNumber: number) {
    playMindMapTapSfx();
    const target: PathTarget = { kind: "verse", book: pericope.book, chapter: pericope.chapter, verse: verseNumber };
    if (!covered(target)) {
      onChoosePath(target);
      return;
    }
    // Every covered verse opens the preview tab — it resolves which lesson (if any) covers the
    // verse itself (see lib/verseLessonAction.ts).
    if (onSelectVerseForLesson) {
      onSelectVerseForLesson(pericope, verseNumber);
      return;
    }
    onSelectChapter(pericope.chapter, verseNumber);
  }

  function onOpenRing(datum: MindMapDatum) {
    const target = pathTargetForDatum(datum);
    if (target && !covered(target)) onChoosePath(target);
  }

  return { onSelectPericope, onSelectVerse, onOpenRing };
}
