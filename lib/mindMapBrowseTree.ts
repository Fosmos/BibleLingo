import type { BibleBook } from "@/types";
import type { MindMapChapterDatum } from "@/lib/mindMapTypes";
import { getAllPericopesForChapter } from "@/lib/chapterPericopes";

// A single browsed (non-active) book's own chapter ring — every chapter 1..book.chapterCount
// gets a plain structural circle (see lib/mindMapHierarchy.ts's own doc comment on why only the
// active book AND whichever one book is currently being browsed ever carry real children), but
// only `focusChapter` (the one chapter actually expanded right now — CAFD only ever has one open
// branch at a time, see lib/mindMapActivePath.ts) gets its real pericope children, once
// lib/useMindMapBrowseChapter.ts's own fetch has cached them. A browsed chapter/pericope's own
// status reads purely off chapter graduation (`completedChapters`, from lib/canonTree.ts's
// completedChaptersForBook) — there's no lesson day to be "active" here until the reader
// actually switches their active path to this book (see BookMindMap.tsx's onSwitchBook).
export function buildBrowsedChapters(
  bookName: string,
  book: BibleBook,
  completedChapters: ReadonlySet<number>,
  focusChapter?: number,
): MindMapChapterDatum[] {
  const chapters: MindMapChapterDatum[] = [];
  for (let chapterNumber = 1; chapterNumber <= book.chapterCount; chapterNumber++) {
    const status = completedChapters.has(chapterNumber) ? "completed" : "locked";
    const pericopes = chapterNumber === focusChapter ? getAllPericopesForChapter(bookName, chapterNumber) : [];
    chapters.push({
      kind: "chapter",
      id: `chapter:${bookName}:${chapterNumber}`,
      label: `${chapterNumber}`,
      chapter: chapterNumber,
      status,
      children: pericopes.map((info, index) => ({
        kind: "pericope",
        id: `pericope:${bookName}:${chapterNumber}:${index}`,
        label: info.heading || (info.startVerse === info.endVerse ? `Verse ${info.startVerse}` : `Verses ${info.startVerse}-${info.endVerse}`),
        verseRange: info.startVerse === info.endVerse ? `v${info.startVerse}` : `v${info.startVerse}–${info.endVerse}`,
        status,
        book: bookName,
        chapter: chapterNumber,
        startVerse: info.startVerse,
        actionKind: "select" as const,
      })),
    });
  }
  return chapters;
}
