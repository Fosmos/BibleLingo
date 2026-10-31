"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { VerseSegment } from "@/types";
import { isDue } from "@/lib/srs";
import { ensureChapterLoaded } from "@/lib/bibleApiClient";
import { findBook } from "@/lib/bibleBooks";
import { BOOK_THEMES } from "@/lib/bookThemes";
import { ensurePericopesLoaded, getAllPericopesForChapter } from "@/lib/chapterPericopes";
import { formatChapterLabel } from "@/lib/chapterContent";
import { shelfChapter, shelfChapters, shelfHref } from "@/lib/memorizedShelf";
import { relearnHref } from "@/lib/relearnHref";
import { useHasMounted } from "@/lib/useHasMounted";
import { useReviewHref } from "@/lib/useReviewHref";
import type { RingVerse } from "@/lib/verseRings";
import { useProgressStore } from "@/store/useProgressStore";
import { BookStructureBook } from "@/components/gamification/BookStructureBook";
import { BookStructureChapter } from "@/components/gamification/BookStructureChapter";
import { ChapterReviewButton } from "@/components/gamification/ChapterReviewButton";
import { TrailNodeSheet } from "@/components/gamification/TrailNodeSheet";
import { RingKey } from "@/components/gamification/VerseRing";
import { VerseStatusDetail } from "@/components/gamification/VerseStatusDetail";
import { FetchLoading } from "@/components/ui/FetchStatus";

interface MemorizedShelfScreenProps {
  book: string;
  chapter?: number;
}

// The Memorized tab's book, then one of its chapters: the same boxes as the Palace tab, from what
// you've memorized. A chapter's verse opens its strength, review dates and what to do with it.
export function MemorizedShelfScreen({ book, chapter }: MemorizedShelfScreenProps) {
  const router = useRouter();
  const mounted = useHasMounted();
  const entities = useProgressStore((state) => state.memorizedEntities);
  const stumbles = useProgressStore((state) => state.wordStumbleCounts);
  const reviewHref = useReviewHref();
  const [now] = useState(() => new Date());
  const [verses, setVerses] = useState<{ chapter: number; list: VerseSegment[] } | null>(null);
  const [failed, setFailed] = useState(false);
  const [sheet, setSheet] = useState<RingVerse | null>(null);
  const version = entities.find((entity) => entity.book === book && entity.chapter === chapter)?.version ?? entities.find((entity) => entity.book === book)?.version ?? "KJV";
  useEffect(() => {
    if (chapter === undefined) return;
    let live = true;
    Promise.all([ensureChapterLoaded(book, chapter, version), ensurePericopesLoaded(book, chapter).catch(() => undefined)])
      .then(([list]) => {
        if (live) setVerses({ chapter, list: list.filter((verse) => verse.text.trim()) });
      })
      .catch(() => {
        if (live) setFailed(true);
      });
    return () => {
      live = false;
    };
  }, [book, chapter, version]);
  const openChapter = useMemo(() => (chapter !== undefined && verses?.chapter === chapter ? shelfChapter(verses.list, getAllPericopesForChapter(book, chapter), entities, stumbles, now) : undefined), [book, chapter, verses, entities, stumbles, now]);
  const info = findBook(book);
  if (!mounted) return <FetchLoading label="Loading…" />;
  if (!info) return <p className="p-6 text-ink-muted">That book wasn’t found.</p>;

  const chapters = shelfChapters(book, info.chapterCount, entities, now);
  const within = entities.filter((entity) => entity.book === book);
  const count = within.reduce((sum, entity) => sum + entity.endVerse - entity.startVerse + 1, 0);
  const due = within.filter((entity) => isDue(entity.srs, now)).length;
  const back = chapter === undefined ? "/memorized" : shelfHref(book);
  const here = shelfHref(book, chapter);
  const entity = sheet?.entity;
  // `shelf`: closing the review comes straight back here (lib/useReaderArrivals.ts).
  const review = (ids: string[]) => {
    const href = reviewHref(ids, true);
    router.push(href ? `${href}&shelf=1` : "/memorized");
  };
  const relearn = sheet && relearnHref(book, sheet.verse.chapter, entity?.startVerse ?? sheet.verse.verseNumber, version, entity?.endVerse, here);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-3 px-4 pb-44 pt-2">
      <Link href={back} className="flex min-h-11 items-center gap-1 self-start text-sm font-extrabold text-sand-700 dark:text-zinc-400">
        <ChevronLeft size={16} strokeWidth={3} />
        {chapter === undefined ? "Memorized" : book}
      </Link>
      <header className="flex flex-col gap-0.5">
        <h1 className="font-heading text-[30px] leading-[1.1] text-ink dark:text-zinc-100">{chapter === undefined ? book : formatChapterLabel(book, chapter)}</h1>
        <span className="text-[13px] font-semibold text-ink-muted">{chapter === undefined ? `${count} ${count === 1 ? "verse" : "verses"}${due ? ` · ${due} due` : " · All good"}` : openChapter ? `${openChapter.known} of ${openChapter.total} verses` : ""}</span>
      </header>
      {chapter === undefined ? (
        <>
          <BookStructureBook chapters={chapters} themes={BOOK_THEMES[book] ?? []} onOpen={(number) => router.push(shelfHref(book, number))} dense />
          <Link href={`/memorized/book?name=${encodeURIComponent(book)}`} className="flex min-h-[52px] items-center justify-between border-t border-sand-200 text-[15px] font-extrabold text-ink dark:border-zinc-900 dark:text-zinc-100">
            Stats and passages
            <ChevronRight size={18} strokeWidth={2.75} className="text-sand-500" />
          </Link>
        </>
      ) : openChapter ? (
        <BookStructureChapter chapter={openChapter} onTapVerse={setSheet} />
      ) : failed ? (
        <p className="py-6 text-center text-sm font-semibold text-ink-muted">This chapter couldn’t load. Check your connection and try again.</p>
      ) : (
        <FetchLoading label="Loading chapter…" />
      )}
      <RingKey showToday={false} />
      {chapter !== undefined && <ChapterReviewButton book={book} chapter={chapter} onReview={review} />}
      {sheet && (
        <TrailNodeSheet stop={sheet.stop} sectionTitle={formatChapterLabel(book, sheet.verse.chapter)} pathLabel={book} lockedTag="Not memorized yet" lockedAction="Close" onClose={() => setSheet(null)} onStart={() => setSheet(null)} onReview={() => review(sheet.stop.dueIds)} onPractise={() => relearn && router.push(relearn)}>
          <VerseStatusDetail entity={entity} strength={sheet.strength} />
          {entity && (
            <Link href={`/memorized/passage?id=${encodeURIComponent(entity.id)}&from=${encodeURIComponent(here)}`} className="flex min-h-11 items-center self-start text-[13px] font-black text-brand-700 dark:text-brand-300">
              Passage stats
            </Link>
          )}
        </TrailNodeSheet>
      )}
    </div>
  );
}
