import type { PathProgress, BibleBook } from "@/types";
import type { ChapterNode } from "@/lib/useMindMapData";
import { findBook } from "@/lib/bibleBooks";
import { BOOK_THEMES, type BookTheme } from "@/lib/bookThemes";
import { computeZoneCardState } from "@/lib/pericopeCardState";
import {
  TESTAMENT_LABELS,
  GENRE_LABELS,
  SUBGENRE_LABELS,
  booksByTestament,
  genresForTestament,
  subgenresForGenre,
  bookCompletionPercent,
  themeCompletionPercent,
  groupCompletionPercent,
  completedChaptersForBook,
  type TestamentId,
  type GenreId,
} from "@/lib/canonTree";
import { buildBrowsedChapters } from "@/lib/mindMapBrowseTree";
import type {
  MindMapChapterDatum,
  MindMapThemeDatum,
  MindMapBookDatum,
  MindMapSubgenreDatum,
  MindMapGenreDatum,
  MindMapTestamentDatum,
  MindMapRootDatum,
} from "@/lib/mindMapTypes";

export type {
  MindMapDatum,
  MindMapPericopeDatum,
  MindMapChapterDatum,
  MindMapThemeDatum,
  MindMapBookDatum,
  MindMapSubgenreDatum,
  MindMapGenreDatum,
  MindMapTestamentDatum,
  MindMapRootDatum,
} from "@/lib/mindMapTypes";

function verseRangeLabel(startVerse: number | undefined, endVerse: number | undefined): string | undefined {
  if (startVerse === undefined || endVerse === undefined) return undefined;
  return startVerse === endVerse ? `v${startVerse}` : `v${startVerse}–${endVerse}`;
}

function chapterRangeLabel(startChapter: number, endChapter: number): string {
  return startChapter === endChapter ? `${startChapter}` : `${startChapter}–${endChapter}`;
}

function buildChapterDatum(bookName: string, chapter: ChapterNode, completedDays: number, todaysDay: number): MindMapChapterDatum {
  return {
    kind: "chapter",
    id: `chapter:${bookName}:${chapter.chapter}`,
    label: `${chapter.chapter}`,
    chapter: chapter.chapter,
    status: chapter.status,
    children: chapter.zones.map((zone) => {
      const cardState = computeZoneCardState(zone, completedDays, todaysDay);
      // Today's own real lesson can span more than one pericope (a chunk of new verses that
      // starts in one section and finishes in another) — every zone it touches should read as
      // "active" on the canvas, not just whichever one owns the actual "Learn" day (see
      // lib/pericopeCardState.ts's own zoneShowsTodaysVerses, which the Path screen's linear
      // list already keys off separately). Mind-Map-local rather than folded into
      // computeZoneCardState itself: that function's own `status` also drives the Path
      // screen's PericopeCard.tsx, where flipping a spillover zone that already has a
      // COMPLETED home day of its own to "active" would wrongly relabel it as today's real
      // lesson there (see that file's own isTodaysLesson) — a risk this canvas-only override
      // doesn't share, since the Mind Map never reads actionKind/actionDay.kind that way.
      const spillsToday = zone.spilloverVerses?.some((entry) => entry.dayNumber === todaysDay) ?? false;
      const status = spillsToday ? "active" : cardState.status;
      return {
        kind: "pericope",
        id: `pericope:${bookName}:${chapter.chapter}:${zone.zoneNumber}`,
        label: zone.heading || zone.label || `Section ${zone.zoneNumber}`,
        verseRange: verseRangeLabel(zone.startVerse, zone.endVerse),
        status,
        book: bookName,
        chapter: chapter.chapter,
        // Tapping this card should open its own action day's real first verse (today's actual
        // next-lesson verse for an "active" zone, the last-practiced verse for a "completed"
        // one) — NOT the zone's own structural startVerse, which can sit several verses earlier
        // than wherever the reader's real progress in this pericope actually is (e.g. a
        // multi-lesson pericope where only its tail end is still unlearned). Falls back to the
        // zone's own startVerse only when this zone has no actionDay of its own to point at
        // (see computeZoneCardState's spillover-only case).
        startVerse: cardState.actionDay?.newVerses[0]?.verseNumber ?? zone.startVerse,
        dayNumber: cardState.actionDay?.dayNumber,
        actionKind: cardState.actionKind,
      };
    }),
  };
}

// Reshapes useMindMapData.ts's own ChapterNode[] (the active book's real, loaded day-plan) plus
// every OTHER book's own static shell (lib/bibleBooks.ts's chapter counts, lib/canonTree.ts's
// completion percentages — both cheap, sync, already-in-memory, no fetch) into one
// Bible -> Testament -> Genre -> (Subgenre ->) Book -> (Theme ->) Chapter -> Pericope tree — the
// shape lib/mindMapTreeLayout.ts's own top-down placement walks directly. The active book always
// carries real chapter/pericope children; `browsedBookName`/`browsedChapter` (see
// BookMindMap.tsx's own useMindMapBrowseChapter call) name the one OTHER book/chapter pair
// currently open for structural browsing (see lib/mindMapBrowseTree.ts) — CAFD's single-open-
// branch rule means there's ever at most one. Every book that's neither active nor currently
// browsed stays a structural dead end with empty `children` — a book nobody's tapped into never
// costs a network request.
export function buildMindMapTree(
  paths: Record<string, PathProgress>,
  activeBookName: string,
  activeChapters: ChapterNode[],
  completedDays: number,
  todaysDay: number,
  browsedBookName?: string,
  browsedChapter?: number,
): MindMapRootDatum {
  function buildTheme(theme: BookTheme, book: BibleBook, chapters: MindMapChapterDatum[]): MindMapThemeDatum {
    const themeChapters = chapters.filter((chapter) => chapter.chapter >= theme.startChapter && chapter.chapter <= theme.endChapter);
    return {
      kind: "theme",
      id: `theme:${book.name}:${theme.id}`,
      label: theme.label,
      reference: chapterRangeLabel(theme.startChapter, theme.endChapter),
      percent: themeCompletionPercent(paths, book, theme),
      children: themeChapters,
    };
  }

  function buildBook(bookName: string): MindMapBookDatum {
    const active = bookName === activeBookName;
    const book = findBook(bookName);
    const browsed = !active && !!book && bookName === browsedBookName;
    const themes = book ? BOOK_THEMES[bookName] : undefined;
    const chapters: MindMapChapterDatum[] = active
      ? activeChapters.map((chapter) => buildChapterDatum(bookName, chapter, completedDays, todaysDay))
      : browsed && book
        ? buildBrowsedChapters(bookName, book, completedChaptersForBook(paths, book), browsedChapter)
        : [];
    const children: MindMapThemeDatum[] | MindMapChapterDatum[] =
      (active || browsed) && themes && book ? themes.map((theme) => buildTheme(theme, book, chapters)) : chapters;
    return {
      kind: "book",
      id: `book:${bookName}`,
      label: bookName,
      name: bookName,
      active,
      percent: book ? bookCompletionPercent(paths, book) : 0,
      children,
    };
  }

  function buildGenreChildren(genreBooks: BibleBook[], testament: TestamentId, genreId: GenreId): MindMapBookDatum[] | MindMapSubgenreDatum[] {
    const subgenres = subgenresForGenre(genreId, genreBooks);
    if (!subgenres) return genreBooks.map((book) => buildBook(book.name));
    return subgenres.map(({ subgenre, books: subBooks }) => ({
      kind: "subgenre" as const,
      id: `subgenre:${testament}:${genreId}:${subgenre}`,
      label: SUBGENRE_LABELS[subgenre],
      percent: groupCompletionPercent(paths, subBooks),
      children: subBooks.map((book) => buildBook(book.name)),
    }));
  }

  const booksByTestamentGroup = booksByTestament();
  const testaments: MindMapTestamentDatum[] = (Object.keys(TESTAMENT_LABELS) as TestamentId[]).map((testament) => {
    const books = booksByTestamentGroup[testament];
    const genres: MindMapGenreDatum[] = genresForTestament(testament, books).map(({ genre, books: genreBooks }) => ({
      kind: "genre" as const,
      id: `genre:${testament}:${genre}`,
      label: GENRE_LABELS[genre],
      percent: groupCompletionPercent(paths, genreBooks),
      children: buildGenreChildren(genreBooks, testament, genre),
    }));
    return {
      kind: "testament",
      id: `testament:${testament}`,
      label: TESTAMENT_LABELS[testament],
      percent: groupCompletionPercent(paths, books),
      children: genres,
    };
  });

  return { kind: "root", id: "root", label: "The Bible", children: testaments };
}
