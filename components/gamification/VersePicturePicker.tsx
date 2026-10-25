"use client";

import { useState } from "react";
import type { VerseSegment } from "@/types";
import { useProgressStore } from "@/store/useProgressStore";
import { PICTURE_LIBRARY, verseImageKey } from "@/lib/verseImages";
import { VersePictureTile } from "@/components/gamification/VersePictureTile";

interface VersePicturePickerProps {
  verse: VerseSegment;
  // The picture it shows now — the reader's own, or the one picked for it (lib/verseImages.ts).
  picture: string;
  learned: boolean;
}

// A verse's picture, tapped in the reader's passage line (ReaderPassagePictures.tsx), beside "Learn it
// with this picture" — tap Change to pick another from the icon library, or go back to the automatic
// one. Saved in UserProgress.iconTags, so the book structure, the reader and the lessons agree.
export function VersePicturePicker({ verse, picture, learned }: VersePicturePickerProps) {
  const key = verseImageKey(verse.book, verse.chapter, verse.verseNumber);
  const own = useProgressStore((state) => state.iconTags[key]);
  const setIconTag = useProgressStore((state) => state.setIconTag);
  const clearIconTag = useProgressStore((state) => state.clearIconTag);
  const [picking, setPicking] = useState(false);
  // A change shows straight away, before the passage works its pictures out again.
  const shown = own ?? picture;

  return (
    <div className="flex flex-col gap-2 pt-1.5">
      <div className="flex items-center gap-3">
        <VersePictureTile pictureId={shown} verseNumber={verse.verseNumber} learned={learned} />
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="text-[14px] font-black text-ink dark:text-zinc-100">Learn it with this picture</span>
          <span className="text-xs font-semibold text-ink-muted">Picture it with the words — it helps the verse stick.</span>
        </div>
        <button type="button" onClick={() => setPicking((open) => !open)} className="shrink-0 rounded-full bg-sand-200 px-3.5 py-2 text-[12.5px] font-black text-ink dark:bg-zinc-800 dark:text-zinc-100">
          {picking ? "Done" : "Change"}
        </button>
      </div>
      {picking && (
        <div className="flex flex-col gap-2 rounded-[18px] border-2 border-sand-300 bg-white p-2.5 dark:border-zinc-700 dark:bg-zinc-900">
          <div className="grid max-h-48 grid-cols-7 gap-1 overflow-y-auto">
            {PICTURE_LIBRARY.map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                aria-label={`Use ${label}`}
                title={label}
                onClick={() => (setIconTag(key, id), setPicking(false))}
                className={`flex h-10 items-center justify-center rounded-xl text-ink dark:text-zinc-100 ${id === shown ? "bg-brand-100 dark:bg-brand-900/40" : "hover:bg-sand-100 dark:hover:bg-zinc-800"}`}
              >
                <Icon size={19} strokeWidth={2.25} />
              </button>
            ))}
          </div>
          {own && (
            <button type="button" onClick={() => (clearIconTag(key), setPicking(false))} className="self-start text-[12px] font-black text-brand-700 dark:text-brand-300">
              Use the automatic picture
            </button>
          )}
        </div>
      )}
    </div>
  );
}
