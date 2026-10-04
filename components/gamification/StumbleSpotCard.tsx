"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Target } from "lucide-react";
import { formatVerseSpanLabel, getChapterVerses } from "@/lib/chapterContent";
import { ensureChapterLoaded } from "@/lib/bibleApiClient";
import { relearnHref } from "@/lib/relearnHref";
import { tokenizeVerseWords } from "@/lib/verseWords";
import type { StumbleSpot } from "@/lib/stumbleSpots";

interface StumbleSpotCardProps {
  spot: StumbleSpot;
}

// One verse in "Where you stumble": how often it's been missed, its text with the most-missed
// word picked out, and "Drill this spot" — the full Learn flow again for just this verse.
export function StumbleSpotCard({ spot }: StumbleSpotCardProps) {
  const [text, setText] = useState(() => getChapterVerses(spot.book, spot.chapter)?.[spot.verseNumber - 1]?.text);

  useEffect(() => {
    if (text) return;
    let cancelled = false;
    ensureChapterLoaded(spot.book, spot.chapter, spot.version)
      .then((verses) => {
        if (!cancelled) setText(verses[spot.verseNumber - 1]?.text);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [text, spot.book, spot.chapter, spot.verseNumber, spot.version]);

  const words = text ? tokenizeVerseWords(text) : [];
  const missedLabel = spot.misses > 0 ? `Missed ${spot.misses} time${spot.misses === 1 ? "" : "s"}` : "Needed a hint";

  return (
    <div className="flex flex-col gap-3 rounded-organic bg-white px-[18px] py-4 shadow-organic-sm dark:bg-zinc-900">
      <div className="flex items-baseline gap-2.5">
        <span className="font-heading text-xl text-ink dark:text-zinc-100">
          {formatVerseSpanLabel(spot.book, spot.chapter, spot.verseNumber, spot.verseNumber)}
        </span>
        <span className="ml-auto shrink-0 text-xs font-bold text-brand-800 dark:text-brand-300">{missedLabel}</span>
      </div>
      {words.length > 0 && (
        <p className="font-reading text-[15px] leading-relaxed text-ink-soft dark:text-zinc-300">
          {words.map((word, index) => (
            <span key={index}>
              {index === spot.worstWordIndex ? (
                <span className="rounded-md bg-brand-200 px-1 font-bold text-brand-800 dark:bg-brand-900/50 dark:text-brand-200">{word}</span>
              ) : (
                word
              )}{" "}
            </span>
          ))}
        </p>
      )}
      <Link
        href={relearnHref(spot.book, spot.chapter, spot.verseNumber, spot.version)}
        className="flex items-center gap-1.5 self-start rounded-full bg-sand-200 px-4 py-2 text-[13px] font-bold text-ink hover:bg-sand-300 dark:bg-zinc-800 dark:text-zinc-100"
      >
        <Target size={15} strokeWidth={2.75} /> Drill this spot
      </Link>
    </div>
  );
}
