"use client";

import { MapPin } from "lucide-react";
import { locusVerses, type ChapterLocus } from "@/lib/chapterLoci";

interface ReaderLocusTagProps {
  entry: ChapterLocus;
  lastVerse: number;
  // Unset while a lesson or review runs: the tag shows, but loci aren't edited in a lesson.
  onTap?: () => void;
}

// A locus in the chapter reader, above its first verse, on the verse rows' own columns (ReaderVerseRow.tsx):
// a pin over the verse numbers, then where it is, the verses it holds, and what's happening there.
// Tapping it opens it for editing (ReaderLocusSheet.tsx).
export function ReaderLocusTag({ entry, lastVerse, onTap }: ReaderLocusTagProps) {
  const body = (
    <>
      <span className="flex h-[24px] items-center justify-center text-brand-700 dark:text-brand-300">
        <MapPin size={17} strokeWidth={2.5} />
      </span>
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="flex items-baseline gap-2">
          <span className="min-w-0 truncate font-heading text-[17px] leading-[24px] text-brand-800 dark:text-brand-300">{entry.locus.name || "Locus"}</span>
          <span className="shrink-0 text-[12px] font-extrabold text-sand-700 dark:text-zinc-400">{locusVerses(entry.from, entry.to, lastVerse)}</span>
        </span>
        {entry.locus.scene && <span className="text-[14px] italic leading-snug text-sand-700 dark:text-zinc-400">{entry.locus.scene}</span>}
      </span>
    </>
  );
  if (!onTap) return <div className="grid grid-cols-[38px_minmax(0,1fr)] gap-2 px-3.5 pb-1 pt-3">{body}</div>;
  return (
    <button type="button" onClick={onTap} className="grid min-h-11 w-full grid-cols-[38px_minmax(0,1fr)] gap-2 px-3.5 pb-1 pt-3 text-left">
      {body}
    </button>
  );
}
