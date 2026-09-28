import type { PathProgress, BibleBook, MemorizedEntity } from "@/types";
import type { ChapterNode } from "@/lib/useMindMapData";
import { findBook } from "@/lib/bibleBooks";
import { BOOK_THEMES, type BookTheme } from "@/lib/bookThemes";
import { learnedVerseNumbers, type PericopeCardState } from "@/lib/pericopeCardState";
import type { PathZone } from "@/lib/pathZones";
import {
  TESTAMENT_LABELS,
  GENRE_LABELS,
  SUBGENRE_LABELS,
  booksByTestament,
  genresForTestament,
  subgenresForGenre,
  completedChaptersForBook,
  type TestamentId,
  type GenreId,
} from "@/lib/canonTree";
import { bookCompletionPercent, themeCompletionPercent, groupCompletionPercent } from "@/lib/bookVerseProgress";
import { buildBrowsedChapters, withWholeChapter } from "@/lib/mindMapBrowseTree";
import { buildMemorizedVerseIndex } from "@/lib/memorizedVerseIndex";
import { withMemorized } from "@/lib/mindMapMemorizedChapter";
import type {
  MindMapChapterDatum,
  MindMapPericopeDatum,
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

// One pericope zone's own datum — shared by buildChapterDatum below (the real Mind Map's whole-
// book tree) and lib/learnVerseSpotlightLayout.ts (the Learn flow's own compact, single-chapter
// spotlight), so the two can never disagree about what a pericope datum looks like.
export function buildPericopeDatum(
  bookName: string,
  chapterNumber: number,
  zone: PathZone,
  cardState: PericopeCardState,
  completedDays: number,
  todaysDay: number,
): MindMapPericopeDatum {
  // Today's own real lesson can span more than one pericope — every zone it touches should
  // read as "active" on the canvas, not just whichever one owns the real "Learn" day (see
  // lib/pericopeCardState.ts's zoneShowsTodaysVerses). Mind-Map-local rather than folded into
  // computeZoneCardState itself: that function's own `status` also drives PericopeCard.tsx,
  // where relabeling an already-COMPLETED spillover zone "active" would wrongly flag it as
  // today's real lesson there — a risk this canvas-only override doesn't share.
  const spillsToday = zone.spilloverVerses?.some((entry) => entry.dayNumber === todaysDay) ?? false;
  const status = spillsToday ? "active" : cardState.status;
  return {
    kind: "pericope",
    id: `pericope:${bookName}:${chapterNumber}:${zone.zoneNumber}`,
    label: zone.heading || zone.label || `Section ${zone.zoneNumber}`,
    verseRange: verseRangeLabel(zone.startVerse, zone.endVerse),
    tagLabel: zone.label,
    status,
    book: bookName,
    chapter: chapterNumber,
    // Tapping the card opens its action day's real first verse (where progress actually is), not
    // the zone's structural start — which it falls back to only with no actionDay (spillover-only).
    startVerse: cardState.actionDay?.newVerses[0]?.verseNumber ?? zone.startVerse,
    rangeStartVerse: zone.startVerse,
    rangeEndVerse: zone.endVerse,
    learnedVerses: learnedVerseNumbers(zone, completedDays),
    dayNumber: cardState.actionDay?.dayNumber,
    actionKind: cardState.actionKind,
  };
}

function buildChapterDatum(bookName: string, chapter: ChapterNode, completedDays: number, todaysDay: number): MindMapChapterDatum {
  return {
    kind: "chapter",
    id: `chapter:${bookName}:${chapter.chapter}`,
    label: `${chapter.chapter}`,
    book: bookName,
    chapter: chapter.chapter,
    status: chapter.status,
    children: chapter.zones.map((zone, index) =>
      buildPericopeDatum(bookName, chapter.chapter, zone, chapter.states[index], completedDays, todaysDay),
    ),
  };
}

// Reshapes useMindMapData.ts's own ChapterNode[] (the active book's real, loaded day-plan) plus
// every OTHER book's own static shell (lib/bibleBooks.ts's chapter counts, lib/canonTree.ts's
// completion percentages — both cheap, sync, already-in-memory, no fetch) into one
// Bible -> Testament -> Genre -> (Subgenre ->) Book -> (Theme ->) Chapter -> Pericope tree — the
// shape lib/mindMapTreeLayout.ts walks. The active book carries real chapter/pericope children;
// `browsedBookName`/`browsedChapter` name the one book/chapter open for structural browsing (see
// lib/mindMapActivePath.ts's findBrowseTarget). Every other book stays an empty dead end — a book
// nobody's tapped into never costs a network request.
export function buildMindMapTree(
  paths: Record<string, PathProgress>,
  activeBookName: string,
  activeChapters: ChapterNode[],
  completedDays: number,
  todaysDay: number,
  browsedBookName?: string,
  browsedChapter?: number,
  entities: MemorizedEntity[] = [],
): MindMapRootDatum {
  const memorized = buildMemorizedVerseIndex(paths, entities);
  function buildTheme(theme: BookTheme, book: BibleBook, chapters: MindMapChapterDatum[]): MindMapThemeDatum {
    const themeChapters = chapters.filter((chapter) => chapter.chapter >= theme.startChapter && chapter.chapter <= theme.endChapter);
    return {
      kind: "theme",
      id: `theme:${book.name}:${theme.id}`,
      label: theme.label,
      reference: chapterRangeLabel(theme.startChapter, theme.endChapter),
      percent: themeCompletionPercent(memorized, book, theme),
      children: themeChapters,
    };
  }

  function buildBook(bookName: string): MindMapBookDatum {
    const active = bookName === activeBookName;
    const book = findBook(bookName);
    const browsed = !active && !!book && bookName === browsedBookName;
    const themes = book ? BOOK_THEMES[bookName] : undefined;
    // A chapter/verse path fills in its own chapter; the rest of its book stays as plain chapters.
    const shellFocus = bookName === browsedBookName ? browsedChapter : undefined;
    const built: MindMapChapterDatum[] = active
      ? book
        ? buildBrowsedChapters(bookName, book, completedChaptersForBook(paths, book), shellFocus).map(
            (shell) => activeChapters.find((node) => node.chapter === shell.chapter) ?? shell,
          ).map((node) => ("zones" in node ? withWholeChapter(buildChapterDatum(bookName, node, completedDays, todaysDay), book) : node))
        : activeChapters.map((chapter) => buildChapterDatum(bookName, chapter, completedDays, todaysDay))
      : browsed && book
        ? buildBrowsedChapters(bookName, book, completedChaptersForBook(paths, book), browsedChapter)
        : [];
    const chapters = built.map((chapter) => withMemorized(chapter, memorized));
    const children: MindMapThemeDatum[] | MindMapChapterDatum[] =
      (active || browsed) && themes && book ? themes.map((theme) => buildTheme(theme, book, chapters)) : chapters;
    return {
      kind: "book",
      id: `book:${bookName}`,
      label: bookName,
      name: bookName,
      active,
      percent: book ? bookCompletionPercent(memorized, book) : 0,
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
      percent: groupCompletionPercent(memorized, subBooks),
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
      percent: groupCompletionPercent(memorized, genreBooks),
      children: buildGenreChildren(genreBooks, testament, genre),
    }));
    return {
      kind: "testament",
      id: `testament:${testament}`,
      label: TESTAMENT_LABELS[testament],
      percent: groupCompletionPercent(memorized, books),
      children: genres,
    };
  });

  return { kind: "root", id: "root", label: "The Bible", children: testaments };
}
