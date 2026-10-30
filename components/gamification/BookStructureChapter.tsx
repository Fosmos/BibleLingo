"use client";

import type { BuiltPalace, VerseSegment } from "@/types";
import type { RingChapter, RingVerse } from "@/lib/verseRings";
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
}

const STATE: Record<RingVerse["kind"], string> = { next: "up next", today: "to learn today", learned: "learned", new: "not learned yet" };
const shortRange = (ref: string) => ref.replace(/^.*? \d+:/, "");

// A chapter opened in the Palace tab: its pericope titles in the margin, their verses as boxes beside them.
export function BookStructureChapter({ chapter, onTapVerse }: BookStructureChapterProps) {
  return (
    <div className="flex flex-col">
      {chapter.passages.map(({ section, verses }) => (
        <section key={section.ref} className="grid grid-cols-[104px_minmax(0,1fr)] gap-x-2.5 border-t border-sand-200 py-2.5 dark:border-zinc-900">
          <div className="flex flex-col gap-0.5">
            <h2 className="text-sm font-extrabold leading-tight text-ink dark:text-zinc-100">{section.title}</h2>
            <span className="text-xs font-bold text-ink-muted">{shortRange(section.ref)}</span>
          </div>
          <div className="grid content-start grid-cols-5">
            {verses.map((ring) => (
              <div key={ring.stop.key} data-next={ring.kind === "next" || undefined}>
                <VerseRing kind={ring.kind} age={ring.age} label={`Verse ${ring.verse.verseNumber}, ${ring.kind === "learned" && ring.age >= 1 ? "needs review" : STATE[ring.kind]}`} onTap={() => onTapVerse(ring)}>
                  {ring.verse.verseNumber}
                </VerseRing>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
