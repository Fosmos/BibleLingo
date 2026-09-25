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
// actually starts a path here (see BookMindMap.tsx's onChoosePath).
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
      book: bookName,
      chapter: chapterNumber,
      status,
      children: pericopes.map((info, index) => ({
        kind: "pericope",
        id: `pericope:${bookName}:${chapterNumber}:${index}`,
        label: info.heading || (info.startVerse === info.endVerse ? `Verse ${info.startVerse}` : `Verses ${info.startVerse}-${info.endVerse}`),
        verseRange: info.startVerse === info.endVerse ? `v${info.startVerse}` : `v${info.startVerse}–${info.endVerse}`,
        tagLabel: info.label,
        status,
        book: bookName,
        chapter: chapterNumber,
        startVerse: info.startVerse,
        rangeStartVerse: info.startVerse,
        rangeEndVerse: info.endVerse,
        actionKind: "select" as const,
      })),
    });
  }
  return chapters;
}

// A path chapter filled out to the whole chapter: a verse path (or any path covering only part of
// its chapter) has halls for just its own verses, which cut the chapter off around them. Every
// other section of the chapter joins as a plain browse hall, and a path hall spans its whole
// section — so every verse of the chapter has a node, and those outside the path offer themselves
// as new paths when tapped. Learned verses are tracked one by one (see lib/pericopeLearned.ts), so
// widening a hall never marks anything learned that wasn't.
export function withWholeChapter(datum: MindMapChapterDatum, book: BibleBook): MindMapChapterDatum {
  const shell = buildBrowsedChapters(datum.book, book, new Set(), datum.chapter).find((chapter) => chapter.chapter === datum.chapter);
  if (!shell || shell.children.length === 0) return datum;
  const children = shell.children.map((section, index) => {
    const start = section.rangeStartVerse ?? 0;
    const end = section.rangeEndVerse ?? -1;
    const own = datum.children.find((hall) => (hall.rangeStartVerse ?? 0) <= end && (hall.rangeEndVerse ?? -1) >= start);
    if (own) return { ...own, rangeStartVerse: Math.min(start, own.rangeStartVerse ?? start), rangeEndVerse: Math.max(end, own.rangeEndVerse ?? end) };
    return { ...section, id: `${section.id}:section-${index}`, status: "locked" as const };
  });
  // A path hall overlapping two sections would appear twice — keep its first.
  const seen = new Set<string>();
  return { ...datum, children: children.filter((hall) => !seen.has(hall.id) && seen.add(hall.id)) };
}
