"use client";

import { Fragment } from "react";
import { MapPin } from "lucide-react";
import type { BuiltPalace, VerseSegment } from "@/types";
import { useProgressStore } from "@/store/useProgressStore";
import { chapterLoci, locusVerses, type ChapterLocus } from "@/lib/chapterLoci";
import { verseSeal, type RingChapter, type RingVerse } from "@/lib/verseRings";
import { VerseRing } from "@/components/gamification/VerseRing";

// The reader's built palace for the path, with what its spot editors need (BookStructureScreen.tsx).
export interface PalaceContext {
  palace: BuiltPalace;
  pathVerses: VerseSegment[];
  pictureOf: (verse: VerseSegment) => string;
  learnedIds: Set<string>;
  // A verse's spot name in the palace, if it's on one.
  spotOf: (verse: VerseSegment) => string | undefined;
  onSave: (palace: BuiltPalace) => void;
}

interface BookStructureChapterProps {
  chapter: RingChapter;
  onTapVerse: (verse: RingVerse) => void;
  // Smaller boxes, six across, for a whole book's chapters on one page (BookChaptersList.tsx).
  compact?: boolean;
}

const STATE: Record<RingVerse["kind"], string> = { next: "up next", today: "to learn today", learned: "learned", new: "not learned yet" };
const shortRange = (ref: string) => ref.replace(/^.*? \d+:/, "");

const NO_PALACES: BuiltPalace[] = [];

// A chapter opened in the Palace tab: its pericope titles in the margin, their verses as boxes beside
// them, grouped under the memory palace loci they're on (each with its verses and your title).
export function BookStructureChapter({ chapter, onTapVerse, compact = false }: BookStructureChapterProps) {
  const palaces = useProgressStore((state) => state.builtPalaces) ?? NO_PALACES;
  const loci = chapterLoci(palaces, chapter.book, chapter.chapter);
  const lastVerse = chapter.passages.at(-1)?.verses.at(-1)?.verse.verseNumber ?? 0;
  const locusOf = (verseNumber: number) => loci.find((entry) => verseNumber >= entry.from && verseNumber <= entry.to);
  // A section's verses in runs, a run to each locus (and the verses on none between them).
  const runs = (verses: RingVerse[]) =>
    verses.reduce<{ locus?: ChapterLocus; verses: RingVerse[] }[]>((list, ring) => {
      const locus = locusOf(ring.verse.verseNumber);
      const last = list.at(-1);
      if (last && last.locus === locus) last.verses.push(ring);
      else list.push({ locus, verses: [ring] });
      return list;
    }, []);
  const box = (ring: RingVerse) => (
    <div key={ring.stop.key} data-next={ring.kind === "next" || undefined}>
      <VerseRing size={compact ? "mini" : "verse"} kind={ring.kind} age={ring.age} seal={verseSeal(chapter, ring)} label={`Verse ${ring.verse.verseNumber}, ${ring.kind === "learned" && ring.age >= 1 ? "needs review" : STATE[ring.kind]}`} onTap={() => onTapVerse(ring)}>
        {ring.verse.verseNumber}
      </VerseRing>
    </div>
  );
  return (
    <div className="flex flex-col">
      {chapter.passages.map(({ section, verses }) => (
        <section key={section.ref} className={`grid border-t border-sand-200 dark:border-zinc-900 ${compact ? "grid-cols-[96px_minmax(0,1fr)] gap-x-3 py-2" : "grid-cols-[104px_minmax(0,1fr)] gap-x-2.5 py-2.5"}`}>
          <div className="flex flex-col gap-0.5">
            <h2 className={`font-extrabold leading-tight text-ink dark:text-zinc-100 ${compact ? "text-[13px]" : "text-sm"}`}>{section.title}</h2>
            <span className="text-xs font-bold text-ink-muted">{shortRange(section.ref)}</span>
          </div>
          <div className="flex flex-col gap-1">
            {runs(verses).map((run) => (
              <Fragment key={run.verses[0].stop.key}>
                {run.locus && (
                  <span className="flex min-w-0 items-baseline gap-1.5 pt-1 text-[12px]">
                    <MapPin size={12} strokeWidth={2.75} className="shrink-0 self-center text-brand-700 dark:text-brand-300" />
                    <span className="truncate font-extrabold text-brand-800 dark:text-brand-300">{run.locus.locus.name || "Locus"}</span>
                    <span className="shrink-0 font-bold text-sand-700 dark:text-zinc-400">{locusVerses(run.locus.from, run.locus.to, lastVerse)}</span>
                    {run.locus.locus.title && <span className="min-w-0 truncate font-extrabold text-ink dark:text-zinc-100">· {run.locus.locus.title}</span>}
                  </span>
                )}
                <div className={`grid content-start ${compact ? "grid-cols-6" : "grid-cols-5"}`}>{run.verses.map(box)}</div>
              </Fragment>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
