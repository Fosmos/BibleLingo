"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft } from "lucide-react";
import type { VerseSegment } from "@/types";
import { formatChapterLabel } from "@/lib/chapterContent";
import { useChapterPathGroups } from "@/lib/useChapterPathGroups";
import { useVerseMemory, STATE_FILL } from "@/lib/useVerseMemory";
import { heldCount } from "@/lib/verseMemoryState";
import { PericopeTrailCard } from "@/components/gamification/PericopeTrailCard";
import { ChapterActionBar } from "@/components/gamification/ChapterActionBar";
import type { VerseStatus } from "@/components/gamification/ChapterPathVerseRow";

interface ChapterPericopeLevelProps {
  book: string;
  chapter: number;
  verses: VerseSegment[];
  statusOf: (verseNumber: number) => VerseStatus;
  selected: number | null;
  onSelect: (verseNumber: number) => void;
  onAction: (verse: VerseSegment, status: VerseStatus) => void;
  onLearn: (verses: number[]) => void;
  onReview: (verses: number[]) => void;
  onBack: () => void;
  // The verse a lesson, review or preview is running on (its card holds the lesson's verse zone),
  // and which verses that lesson leaves empty.
  lessonVerse: number | null;
  isHidden: (verseNumber: number) => boolean;
}

// Brings `selector`'s element to `offset` px below the scroller's top, a frame later (once cards
// have opened or closed and laid out).
function scrollToElement(scroller: HTMLElement | null, selector: string, offset: number): number {
  return requestAnimationFrame(() => {
    const target = scroller?.querySelector<HTMLElement>(selector);
    if (!scroller || !target) return;
    scroller.scrollTo({ top: scroller.scrollTop + target.getBoundingClientRect().top - scroller.getBoundingClientRect().top - offset, behavior: "smooth" });
  });
}

// The Path tab's level 1 (shelf_path): a chapter as its pericope cards, one expanded at a time into
// the path view. A card is tracked by a verse inside it, so it stays open when the pericopes arrive
// and split the chapter. While a lesson runs, the card holding its verse is the one open.
export function ChapterPericopeLevel(props: ChapterPericopeLevelProps) {
  const { book, chapter, verses, statusOf, selected, onSelect, onAction, onLearn, onReview, onBack, lessonVerse, isHidden } = props;
  const groups = useChapterPathGroups(book, chapter, verses);
  const memory = useVerseMemory();
  const [openAnchor, setOpenAnchor] = useState<number | null>(selected);
  const [chosen, setChosen] = useState<Set<number>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);
  const lessonRunning = lessonVerse !== null;
  const anchor = lessonVerse ?? openAnchor;
  const openKey = groups.find((group) => group.verses.some((verse) => verse.verseNumber === anchor))?.key ?? null;

  // On arrival, the selected verse; when a lesson starts or moves on, its verse, under the top bar.
  useEffect(() => {
    const target = lessonVerse ?? selected;
    if (target === null) return;
    const frame = scrollToElement(scrollRef.current, `[data-verse="${target}"]`, lessonRunning ? 64 : 160);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- on arrival and as a lesson moves, not on every selection tap
  }, [lessonVerse, groups.length]);

  function toggleOpen(key: string) {
    const group = groups.find((candidate) => candidate.key === key);
    if (!group || lessonRunning) return;
    const opening = openKey !== key;
    setOpenAnchor(opening ? group.verses[0].verseNumber : null);
    if (opening) scrollToElement(scrollRef.current, `[data-pericope="${key}"]`, 8);
  }

  const toggleChosen = (verse: number) =>
    setChosen((prev) => {
      const next = new Set(prev);
      if (next.has(verse)) next.delete(verse);
      else next.add(verse);
      return next;
    });
  const chooseAll = (picked: number[]) => setChosen((prev) => new Set([...prev, ...picked]));
  const counts = memory.chapter(book, chapter);
  const due = memory.dueVerses(book, chapter, verses[verses.length - 1]?.verseNumber ?? 0);
  // A chosen verse that's since been learned drops out.
  const chosenOpen = [...chosen].filter((verse) => statusOf(verse) === "open" || statusOf(verse) === "current").sort((a, b) => a - b);

  return (
    <div className="relative flex h-full flex-col">
      {!lessonRunning && (
        <header className="flex shrink-0 items-end gap-2.5 px-[18px] pb-3 pt-1">
          <button type="button" onClick={onBack} aria-label="Back to shelves" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sand-100 text-ink hover:bg-sand-200 dark:bg-zinc-800 dark:text-zinc-100">
            <ChevronLeft size={22} strokeWidth={2.5} />
          </button>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="text-[11px] font-extrabold uppercase tracking-[.06em] text-sage-800 dark:text-sage-300">
              {book} · {heldCount(counts)} of {verses.length} held
            </span>
            <h1 className="font-heading text-[28px] leading-[1.05] text-ink dark:text-zinc-100">{formatChapterLabel(book, chapter)}</h1>
          </div>
          {counts.due > 0 && <span className="whitespace-nowrap rounded-full bg-brand-100 px-2.5 py-1 text-xs font-extrabold text-brand-800">{counts.due} due</span>}
        </header>
      )}
      <div ref={scrollRef} className={`flex min-h-0 flex-1 flex-col gap-[18px] overflow-y-auto px-4 [overflow-anchor:none] ${lessonRunning ? "pb-[70dvh] pt-2" : "pb-[220px]"}`}>
        {!lessonRunning && <Legend />}
        {groups.map((group) => (
          <PericopeTrailCard
            key={group.key}
            group={group}
            statusOf={statusOf}
            chosen={chosen}
            open={openKey === group.key}
            onToggleOpen={() => toggleOpen(group.key)}
            selected={selected}
            onSelect={onSelect}
            onAction={onAction}
            onToggleChosen={toggleChosen}
            onChooseAll={chooseAll}
            onLearn={onLearn}
            onReview={onReview}
            lessonVerse={lessonVerse}
            isHidden={isHidden}
          />
        ))}
      </div>
      {!lessonRunning && <ChapterActionBar book={book} chapter={chapter} chosen={chosenOpen} due={due} onLearn={onLearn} onReview={onReview} />}
    </div>
  );
}

function Legend() {
  const items = [
    ["rooted", "Memorized"],
    ["growing", "Growing"],
    ["due", "Needs review"],
  ] as const;
  return (
    <div className="-mb-1.5 flex shrink-0 flex-wrap gap-x-3 gap-y-1.5 text-[11px] font-bold text-ink dark:text-zinc-200">
      {items.map(([state, label]) => (
        <span key={state} className="flex items-center gap-[5px]">
          <span className={`h-[11px] w-[11px] rounded-full ${STATE_FILL[state]}`} />
          {label}
        </span>
      ))}
      <span className="flex items-center gap-[5px]">
        <span className="h-[11px] w-[11px] rounded-full border-2 border-dashed border-ink-muted" />
        Can choose
      </span>
    </div>
  );
}
