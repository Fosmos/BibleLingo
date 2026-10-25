"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronDown } from "lucide-react";
import type { TrailSection, TrailStop } from "@/lib/trailStops";
import { BOOK_THEMES } from "@/lib/bookThemes";
import { getPericopeForVerse } from "@/lib/chapterPericopes";
import { locationTagKey } from "@/lib/locationTags";
import { passagePictures } from "@/lib/verseImages";
import { useProgressStore } from "@/store/useProgressStore";
import { LocationTagField } from "@/components/gamification/LocationTagField";
import { BookStructurePassage } from "@/components/gamification/BookStructurePassage";

interface BookStructureScreenProps {
  pathLabel: string;
  // The book's name, for its themes (lib/bookThemes.ts) — unset for a path that isn't one book.
  book?: string;
  sections: TrailSection[];
  // Start (or practise) a lesson — it runs in the reader (PathTrailScreen.tsx).
  onStart: (stop: TrailStop) => void;
}

export interface StructurePassage {
  index: number;
  section: TrailSection;
  chapter: number;
  lessons: TrailStop[];
  pictures: string[];
  // Its spot in the chapter's room — the pericope's own place tag (lib/locationTags.ts).
  spotKey?: string;
}

// The Palace tab: the whole book on one page, as a memory palace — its chapters in order (under its
// themes, for a long book), each a room you name, each chapter's passages spots in that room you name,
// and under each passage its verses' picture tiles (dual coding — lib/verseImages.ts), in colour once
// learned. Tap a passage to open it right here (BookStructurePassage.tsx); the one you're on starts
// open and stays highlighted in orange. Room and spot names are the place tags the Path map shows
// too — shown once given, offered only on the passage that's open, so the page stays quiet.
export function BookStructureScreen({ pathLabel, book, sections, onStart }: BookStructureScreenProps) {
  const chosen = useProgressStore((state) => state.iconTags);
  const places = useProgressStore((state) => state.locationTags);
  const passages = useMemo<StructurePassage[]>(
    () =>
      sections.flatMap((section, index) => {
        const lessons = section.stops.filter((stop) => stop.verse);
        const first = lessons[0]?.verse;
        if (section.review || !first) return [];
        const pericope = getPericopeForVerse(first.book, first.chapter, first.verseNumber);
        return [{ index, section, chapter: first.chapter, lessons, pictures: passagePictures(lessons.map((stop) => stop.verse!), chosen), spotKey: pericope ? locationTagKey({ level: "pericope", book: first.book, chapter: first.chapter, pericopeLabel: pericope.label }) : undefined }];
      }),
    [sections, chosen],
  );
  const chapters = [...new Set(passages.map((passage) => passage.chapter))];
  const learned = passages.reduce((sum, passage) => sum + passage.lessons.filter((stop) => stop.state === "done").length, 0);
  const verses = passages.reduce((sum, passage) => sum + passage.lessons.length, 0);
  const current = passages.find((passage) => passage.section.state !== "complete")?.index;
  const [open, setOpen] = useState<number | null>(current ?? null);
  const themes = (book && BOOK_THEMES[book]) || [];
  // Room and spot names show once given; the buttons to give them only on the passage you have open.
  const openChapter = passages.find((passage) => passage.index === open)?.chapter;
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scrollRef.current?.querySelector("[data-current]")?.scrollIntoView({ block: "start" });
  }, []);

  return (
    <div className="flex h-[100dvh] w-full flex-col -mb-28">
      <header className="flex shrink-0 items-center gap-2.5 px-3.5 pb-2 pt-[calc(0.5rem+env(safe-area-inset-top))]">
        <Link href="/" aria-label="Back to your paths" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] text-sand-600 hover:bg-sand-100 dark:text-zinc-400 dark:hover:bg-zinc-900">
          <ArrowLeft size={20} strokeWidth={2.75} />
        </Link>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="text-[11px] font-black uppercase tracking-[.08em] text-sage-800 dark:text-sage-300">Memory palace</span>
          <span className="truncate font-heading text-[28px] leading-none text-ink dark:text-zinc-100">{pathLabel}</span>
          <span className="mt-1 text-xs font-extrabold text-ink-muted">
            {chapters.length} {chapters.length === 1 ? "room" : "rooms"} · {passages.length} spots · {learned}/{verses} verses learned
          </span>
        </div>
      </header>
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-4 pb-[140px] pt-1 [scrollbar-width:none]">
        {chapters.map((chapter) => {
          const theme = themes.find((entry) => entry.startChapter === chapter);
          return (
            <div key={chapter}>
              {theme && <p className="mt-5 px-1 text-[11px] font-black uppercase tracking-[.08em] text-sand-700 dark:text-zinc-400">{theme.label}</p>}
              <div className="grid grid-cols-[34px_minmax(0,1fr)] gap-2.5 pt-3">
                <span className="text-center font-heading text-[26px] leading-none text-sand-700 dark:text-zinc-400">{chapter}</span>
                <div className="flex flex-col">
                  {book && (places[locationTagKey({ level: "chapter", book, chapter })] || chapter === openChapter) && (
                    <LocationTagField tagKey={locationTagKey({ level: "chapter", book, chapter })} addLabel="Name this room" className="mb-1.5 self-start" />
                  )}
                  {passages
                    .filter((passage) => passage.chapter === chapter)
                    .map((passage) => (
                      <div key={passage.index} data-current={passage.index === current || undefined}>
                        <button
                          type="button"
                          aria-expanded={open === passage.index}
                          onClick={() => setOpen(open === passage.index ? null : passage.index)}
                          className={`flex w-full items-baseline justify-between gap-2 border-l-2 pl-3 pr-1 pt-1.5 text-left ${passage.index === current || open === passage.index ? "rounded-tr-[16px] border-brand-500 bg-brand-100/60 dark:bg-brand-900/25" : "border-sand-300 dark:border-zinc-700"}`}
                        >
                          <span className={`font-heading text-[16px] leading-snug ${passage.index === current ? "text-brand-700 dark:text-brand-300" : "text-ink dark:text-zinc-100"}`}>{passage.section.title}</span>
                          <span className="flex shrink-0 items-center gap-1 text-[10.5px] font-extrabold text-sand-600 dark:text-zinc-500">
                            {passage.section.ref.replace(/^.*? (\d+:)/, "$1")}
                            <ChevronDown size={13} strokeWidth={3} className={`transition-transform ${open === passage.index ? "rotate-180" : ""}`} />
                          </span>
                        </button>
                        <BookStructurePassage passage={passage} open={open === passage.index} current={passage.index === current} onToggle={() => setOpen(open === passage.index ? null : passage.index)} onStart={onStart} />
                      </div>
                    ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
