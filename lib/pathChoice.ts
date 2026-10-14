import type { PathKind, PathProgress } from "@/types";
import { BIBLE_BOOKS, findBook } from "@/lib/bibleBooks";
import { TOPICS, pathKey, parsePathKey } from "@/lib/memorizationContent";
import { formatChapterLabel } from "@/lib/chapterContent";

// One thing the new-path picker can start (design_handoff_path_picker → Picker): a book, a
// chapter, a single verse or a topic, with its path key and display title.
export interface PathChoice {
  kind: PathKind;
  key: string;
  title: string;
  book?: string;
  chapter?: number;
  verse?: number;
}

export const bookChoice = (book: string): PathChoice => ({ kind: "book", key: pathKey("book", book), title: book, book });
export const chapterChoice = (book: string, chapter: number): PathChoice => ({ kind: "chapter", key: pathKey("chapter", `${book}|${chapter}`), title: formatChapterLabel(book, chapter), book, chapter });
export const verseChoice = (book: string, chapter: number, verse: number): PathChoice => ({ kind: "verse", key: pathKey("verse", `${book}|${chapter}|${verse}`), title: `${formatChapterLabel(book, chapter)}:${verse}`, book, chapter, verse });
export const topicChoice = (id: string): PathChoice => ({ kind: "topic", key: pathKey("topic", id), title: TOPICS.find((topic) => topic.id === id)?.label ?? id });

// A path key back as a choice (the focused path, pre-selected when it's this type).
export function choiceFromKey(key: string): PathChoice | null {
  const { kind, identifier } = parsePathKey(key);
  const [book, chapter, verse] = identifier.split("|");
  if (kind === "book" && findBook(book)) return bookChoice(book);
  if (kind === "chapter" && findBook(book)) return chapterChoice(book, Number(chapter));
  if (kind === "verse" && findBook(book) && !verse.includes("-")) return verseChoice(book, Number(chapter), Number(verse));
  if (kind === "topic") return topicChoice(identifier);
  return null;
}

// Each type's Suggested option: what follows the path you're on of that type (the next chapter of
// a chapter path, the next verse of a verse path, the book you're in), a topic you haven't
// started, or a good first pick — Philippians, Romans 8, Romans 8:28.
export function suggestedChoice(kind: PathKind, activeKey: string | null, paths: Record<string, PathProgress>): PathChoice {
  const active = activeKey ? choiceFromKey(activeKey) : null;
  if (kind === "book") return active?.book ? bookChoice(active.book) : bookChoice("Philippians");
  if (kind === "chapter") {
    if (active?.kind === "chapter" && active.book && active.chapter) {
      const count = findBook(active.book)?.chapterCount ?? 0;
      if (active.chapter < count) return chapterChoice(active.book, active.chapter + 1);
    }
    return chapterChoice("Romans", 8);
  }
  if (kind === "verse") return active?.kind === "verse" && active.book && active.chapter && active.verse ? verseChoice(active.book, active.chapter, active.verse + 1) : verseChoice("Romans", 8, 28);
  const fresh = TOPICS.find((topic) => !paths[pathKey("topic", topic.id)]);
  return topicChoice((fresh ?? TOPICS[0]).id);
}

export const ALL_BOOKS = BIBLE_BOOKS;
