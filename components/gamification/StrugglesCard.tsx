"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useProgressStore } from "@/store/useProgressStore";
import { formatVerseSpanLabel } from "@/lib/chapterContent";
import { topStruggles, type StruggleRanking, type StruggleVerse } from "@/lib/struggles";

interface StrugglesCardProps {
  // Just this book's verses (the book page); every book when unset (the Memorized tab).
  book?: string;
}

const TABS: { id: StruggleRanking; label: string }[] = [
  { id: "verses", label: "Verses" },
  { id: "firstWords", label: "First words" },
];

const EMPTY: Record<StruggleRanking, string> = {
  verses: "Nothing yet — words you miss while learning and reviewing show up here.",
  firstWords: "Nothing yet — verses whose first word you miss show up here.",
};

function detail(verse: StruggleVerse, ranking: StruggleRanking): string {
  if (ranking === "firstWords") return `${verse.word ? `Starts “${verse.word}” · ` : ""}first word missed ${verse.firstWordMisses}×`;
  return `${verse.word ? `“${verse.word}” missed ${verse.wordMisses}× · ` : ""}${verse.misses} ${verse.misses === 1 ? "miss" : "misses"} in all`;
}

// The three verses the reader struggles with most (lib/struggles.ts) — by every missed word, or on
// its own tab, by missing the verse's first word — each opening its passage's stats page.
export function StrugglesCard({ book }: StrugglesCardProps) {
  const stumbles = useProgressStore((state) => state.wordStumbleCounts);
  const entities = useProgressStore((state) => state.memorizedEntities);
  const [ranking, setRanking] = useState<StruggleRanking>("verses");
  const verses = topStruggles(stumbles, entities, ranking, book);

  return (
    <section className="flex flex-col gap-2.5 rounded-[22px] border-2 border-sand-300 bg-sand-100 p-3.5 shadow-[0_4px_0_#DCD3C4] dark:border-zinc-700 dark:bg-zinc-900" aria-label="Where you struggle">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-[11px] font-black uppercase tracking-[.08em] text-sage-800 dark:text-sage-300">Where you struggle</h2>
        <div role="tablist" className="flex gap-1 rounded-full bg-sand-200 p-0.5 dark:bg-zinc-800">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={ranking === tab.id}
              onClick={() => setRanking(tab.id)}
              className={`rounded-full px-3 py-1 text-[12px] font-black ${ranking === tab.id ? "bg-white text-ink shadow-sm dark:bg-zinc-700 dark:text-zinc-100" : "text-ink-muted"}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      {verses.length === 0 ? (
        <p className="text-sm font-semibold text-ink-muted">{EMPTY[ranking]}</p>
      ) : (
        <ol className="flex flex-col">
          {verses.map((verse, index) => {
            const body = (
              <>
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[13px] font-black text-brand-800 dark:bg-brand-900/40 dark:text-brand-200">{index + 1}</span>
                <span className="flex min-w-0 flex-1 flex-col gap-px">
                  <span className="truncate text-[14.5px] font-black text-ink dark:text-zinc-100">{formatVerseSpanLabel(verse.book, verse.chapter, verse.verseNumber, verse.verseNumber)}</span>
                  <span className="truncate text-[11.5px] font-extrabold text-ink-muted">{detail(verse, ranking)}</span>
                </span>
              </>
            );
            return (
              <li key={verse.key} className="border-t-2 border-sand-200 first:border-t-0 dark:border-zinc-800">
                {verse.entityId ? (
                  <Link href={`/memorized/passage?id=${encodeURIComponent(verse.entityId)}`} className="flex items-center gap-2.5 py-2">
                    {body}
                    <ChevronRight size={16} strokeWidth={2.75} className="shrink-0 text-sand-500" />
                  </Link>
                ) : (
                  <div className="flex items-center gap-2.5 py-2">{body}</div>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
