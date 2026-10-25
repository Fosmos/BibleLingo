"use client";

import { useState } from "react";
import type { VerseSegment } from "@/types";
import { useProgressStore } from "@/store/useProgressStore";
import { passagePictures } from "@/lib/verseImages";
import type { VerseStatus } from "@/lib/readerVerseStatus";
import { VersePicturePicker } from "@/components/gamification/VersePicturePicker";
import { VersePictureTile } from "@/components/gamification/VersePictureTile";

interface ReaderPassagePicturesProps {
  verses: VerseSegment[];
  statusOf: (verseNumber: number) => VerseStatus;
}

const LEARNED: VerseStatus[] = ["rooted", "growing", "due"];

// A passage's storyboard in the reader (ReaderChapterSection.tsx): one line of its verses' picture
// tiles under its heading (dual coding — lib/verseImages.ts), in colour once learned, faded until
// then. Tap one to change it (VersePicturePicker.tsx).
export function ReaderPassagePictures({ verses, statusOf }: ReaderPassagePicturesProps) {
  const chosen = useProgressStore((state) => state.iconTags);
  const real = verses.filter((verse) => verse.text.trim());
  const pictures = passagePictures(real, chosen);
  const [editing, setEditing] = useState<number | null>(null);
  const verse = real.find((candidate) => candidate.verseNumber === editing);

  return (
    <div className="flex flex-col gap-2 pt-1">
      <div className="flex flex-wrap gap-1.5">
        {real.map((entry, index) => (
          <button
            key={entry.verseNumber}
            type="button"
            onClick={() => setEditing(editing === entry.verseNumber ? null : entry.verseNumber)}
            aria-label={`Verse ${entry.verseNumber}'s picture — change it`}
          >
            <VersePictureTile pictureId={pictures[index]} verseNumber={entry.verseNumber} learned={LEARNED.includes(statusOf(entry.verseNumber))} selected={editing === entry.verseNumber} />
          </button>
        ))}
      </div>
      {verse && (
        <div className="rounded-[18px] bg-sand-100 p-2.5 dark:bg-zinc-900">
          <span className="text-[11px] font-black uppercase tracking-[.06em] text-sage-800 dark:text-sage-300">
            {verse.chapter}:{verse.verseNumber}
          </span>
          <VersePicturePicker verse={verse} picture={pictures[real.indexOf(verse)]} learned={LEARNED.includes(statusOf(verse.verseNumber))} />
        </div>
      )}
    </div>
  );
}
