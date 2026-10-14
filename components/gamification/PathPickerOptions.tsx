"use client";

import { useEffect, useState } from "react";
import { ChevronLeft } from "lucide-react";
import type { PathKind } from "@/types";
import { findBook } from "@/lib/bibleBooks";
import { TOPICS } from "@/lib/memorizationContent";
import { formatChapterLabel } from "@/lib/chapterContent";
import { ensureChapterLoaded } from "@/lib/bibleApiClient";
import { useVerseMemory } from "@/lib/useVerseMemory";
import { heldCount } from "@/lib/verseMemoryState";
import { bookLength, chapterLength } from "@/lib/bibleProgress";
import { ALL_BOOKS, bookChoice, chapterChoice, topicChoice, verseChoice, type PathChoice } from "@/lib/pathChoice";
import { PathOptionRow } from "@/components/gamification/PathOptionRow";
import { PathNumberGrid } from "@/components/gamification/PathNumberGrid";

interface PathPickerOptionsProps {
  kind: PathKind;
  query: string;
  suggested: PathChoice;
  activeKey: string | null;
  selected: PathChoice | null;
  onSelect: (choice: PathChoice) => void;
}

// What the picker lists for a type: books (a book path, or the first step of a chapter / verse
// path — then a chapter grid, then a verse grid), or topics. The Suggested option always first.
export function PathPickerOptions({ kind, query, suggested, activeKey, selected, onSelect }: PathPickerOptionsProps) {
  const memory = useVerseMemory();
  const [book, setBook] = useState<string | null>(null);
  const [chapter, setChapter] = useState<number | null>(null);
  const [verseCount, setVerseCount] = useState<number | null>(null);
  useEffect(() => {
    if (kind !== "verse" || !book || !chapter) return;
    let cancelled = false;
    const known = chapterLength(book, chapter);
    if (known.exact) setTimeout(() => !cancelled && setVerseCount(known.total), 0);
    else ensureChapterLoaded(book, chapter, "KJV").then((verses) => !cancelled && setVerseCount(verses.length)).catch(() => !cancelled && setVerseCount(known.total));
    return () => {
      cancelled = true;
    };
  }, [kind, book, chapter]);

  const row = (choice: PathChoice, meta: string, percent: number) => (
    <PathOptionRow key={choice.key} title={choice.title} meta={meta} percent={percent} suggested={choice.key === suggested.key} current={choice.key === activeKey} selected={choice.key === selected?.key} onSelect={() => onSelect(choice)} />
  );
  const bookPercent = (name: string) => (heldCount(memory.book(name)) / bookLength(name)) * 100;
  const suggestedRow = () => {
    if (suggested.kind === "chapter" && suggested.book && suggested.chapter) return row(suggested, `${chapterLength(suggested.book, suggested.chapter).total} verses`, (heldCount(memory.chapter(suggested.book, suggested.chapter)) / chapterLength(suggested.book, suggested.chapter).total) * 100);
    if (suggested.kind === "verse" && suggested.book && suggested.chapter && suggested.verse) return row(suggested, "1 verse", memory.stateOf(suggested.book, suggested.chapter, suggested.verse) === "open" ? 0 : 100);
    return null;
  };

  if (kind === "topic") {
    const topics = TOPICS.filter((topic) => topic.label.toLowerCase().includes(query.toLowerCase())).sort((a, b) => Number(topicChoice(b.id).key === suggested.key) - Number(topicChoice(a.id).key === suggested.key));
    if (!topics.length) return <p className="text-[13px] font-bold text-sand-700">Nothing matches &ldquo;{query}&rdquo;.</p>;
    return <>{topics.map((topic) => row(topicChoice(topic.id), `${topic.verses.length} verses`, (topic.verses.filter((verse) => memory.stateOf(verse.book, verse.chapter, verse.verseNumber) !== "open").length / topic.verses.length) * 100))}</>;
  }

  if (book && kind !== "book") {
    const info = findBook(book);
    const back = (
      <button type="button" onClick={() => (chapter ? (setChapter(null), setVerseCount(null)) : setBook(null))} className="flex items-center gap-1 self-start rounded-full bg-sand-200 py-2 pl-2 pr-3.5 text-[13px] font-extrabold text-ink dark:bg-zinc-800 dark:text-zinc-100">
        <ChevronLeft size={16} strokeWidth={2.75} /> {chapter ? formatChapterLabel(book, chapter) : book}
      </button>
    );
    if (kind === "verse" && chapter) {
      return (
        <>
          {back}
          {verseCount === null ? <p className="text-sm font-bold text-sand-700">Loading verses…</p> : <PathNumberGrid count={verseCount} selected={selected?.book === book && selected.chapter === chapter ? (selected.verse ?? null) : null} known={(verse) => memory.stateOf(book, chapter, verse) !== "open"} onSelect={(verse) => onSelect(verseChoice(book, chapter, verse))} />}
        </>
      );
    }
    return (
      <>
        {back}
        <PathNumberGrid
          count={info?.chapterCount ?? 1}
          selected={kind === "chapter" && selected?.book === book ? (selected.chapter ?? null) : null}
          known={(number) => heldCount(memory.chapter(book, number)) > 0}
          onSelect={(number) => (kind === "chapter" ? onSelect(chapterChoice(book, number)) : setChapter(number))}
        />
      </>
    );
  }

  const books = ALL_BOOKS.filter((entry) => entry.name.toLowerCase().includes(query.toLowerCase()));
  if (!books.length) return <p className="text-[13px] font-bold text-sand-700">Nothing matches &ldquo;{query}&rdquo;.</p>;
  if (kind === "book") {
    const sorted = [...books].sort((a, b) => Number(bookChoice(b.name).key === suggested.key) - Number(bookChoice(a.name).key === suggested.key));
    return <>{sorted.map((entry) => row(bookChoice(entry.name), `${bookLength(entry.name).toLocaleString()} verses · ${entry.chapterCount} chapters`, bookPercent(entry.name)))}</>;
  }
  return (
    <>
      {!query && suggestedRow()}
      {books.map((entry) => (
        <PathOptionRow key={entry.name} title={entry.name} meta={`${entry.chapterCount} chapters · pick a ${kind === "verse" ? "chapter, then a verse" : "chapter"}`} percent={bookPercent(entry.name)} selected={false} onSelect={() => setBook(entry.name)} />
      ))}
    </>
  );
}
