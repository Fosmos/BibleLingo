"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { TrailSection, TrailStop } from "@/lib/trailStops";
import { BOOK_THEMES } from "@/lib/bookThemes";
import { passagePictures } from "@/lib/verseImages";
import { usePalaceContext } from "@/lib/usePalaceContext";
import { useProgressStore } from "@/store/useProgressStore";
import { BookStructureChapter } from "@/components/gamification/BookStructureChapter";
import { PalaceBuiltPanel } from "@/components/gamification/PalaceBuiltPanel";

interface BookStructureScreenProps {
  pathKey: string;
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
}

// The Palace tab: the whole book on one page with the reader's own memory palace built into it — at
// the top, the real place they're building it in and its rooms (PalaceBuiltPanel.tsx); below, the
// book's chapters in order (under its themes, for a long book), each its verses' storyboard (dual
// coding — lib/verseImages.ts), in colour once learned. Tap a chapter to open it right here
// (BookStructureChapter.tsx): its passages named, your next verse to start, and the spots its verses
// are on in the palace, made and edited there. The chapter you're on starts open, with the passage
// you're on highlighted in orange.
export function BookStructureScreen({ pathKey, pathLabel, book, sections, onStart }: BookStructureScreenProps) {
  const chosen = useProgressStore((state) => state.iconTags);
  const passages = useMemo<StructurePassage[]>(
    () =>
      sections.flatMap((section, index) => {
        const lessons = section.stops.filter((stop) => stop.verse);
        const first = lessons[0]?.verse;
        if (section.review || !first) return [];
        return [{ index, section, chapter: first.chapter, lessons, pictures: passagePictures(lessons.map((stop) => stop.verse!), chosen) }];
      }),
    [sections, chosen],
  );
  const chapters = [...new Set(passages.map((passage) => passage.chapter))];
  const learned = passages.reduce((sum, passage) => sum + passage.lessons.filter((stop) => stop.state === "done").length, 0);
  const verses = passages.reduce((sum, passage) => sum + passage.lessons.length, 0);
  const currentPassage = passages.find((passage) => passage.section.state !== "complete");
  const current = currentPassage?.index;
  const [open, setOpen] = useState<number | null>(currentPassage?.chapter ?? null);
  const themes = (book && BOOK_THEMES[book]) || [];
  const built = usePalaceContext(pathKey, passages);
  const saveBuiltPalace = useProgressStore((state) => state.saveBuiltPalace);
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
            {chapters.length} {chapters.length === 1 ? "chapter" : "chapters"} · {passages.length} passages · {learned}/{verses} verses learned
          </span>
        </div>
      </header>
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-4 pb-[140px] pt-1 [scrollbar-width:none]">
        <PalaceBuiltPanel pathKey={pathKey} palace={built?.palace} onSave={saveBuiltPalace} />
        {chapters.map((chapter) => {
          const theme = themes.find((entry) => entry.startChapter === chapter);
          return (
            <div key={chapter}>
              {theme && <p className="mt-5 px-1 text-[11px] font-black uppercase tracking-[.08em] text-sand-700 dark:text-zinc-400">{theme.label}</p>}
              <BookStructureChapter chapter={chapter} passages={passages.filter((passage) => passage.chapter === chapter)} open={open === chapter} currentIndex={current} built={built} onToggle={() => setOpen(open === chapter ? null : chapter)} onStart={onStart} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
