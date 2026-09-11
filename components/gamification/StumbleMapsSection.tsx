"use client";

import { Flame } from "lucide-react";
import type { MemorizedEntity } from "@/types";
import { useProgressStore } from "@/store/useProgressStore";
import { parseVerseKey } from "@/lib/verseKey";
import { InfoTip } from "@/components/ui/InfoTip";
import { INFO_TIPS } from "@/lib/infoTipCopy";
import { StumbleMapChapterRow, type StumbleVerseEntry } from "@/components/gamification/StumbleMapChapterRow";

// A stumble-tracked verse's own translation isn't stored alongside its miss counts (see
// UserProgress.wordStumbleCounts) — recovered here from whichever memorized entity's own
// range actually covers it. Falls back to KJV, same "never asked/older data" default this app
// already uses elsewhere (see app/memorized/relearn/page.tsx), for a verse whose entity has
// since been removed but whose review history hasn't.
function resolveVersion(entities: MemorizedEntity[], book: string, chapter: number, verseNumber: number): string {
  const match = entities.find(
    (entity) => entity.book === book && entity.chapter === chapter && verseNumber >= entity.startVerse && verseNumber <= entity.endVerse,
  );
  return match?.version ?? "KJV";
}

// Every CHAPTER the reader has ever reviewed and missed at least one word in — not just the
// verses currently flagged into Problem Verses (see ProblemVersesBin.tsx), which only tracks
// whichever verse most recently needed a hint. This is the complete picture, grouped by
// chapter rather than by individual verse (a reader thinks "my trouble spots in Mark 1," not
// verse by verse) — worst chapter (by total miss count across every verse in it) first; within
// a chapter, StumbleMapChapterRow.tsx sorts and shows its own verses in reading order. See
// lib/stumbleTracking.ts for the fixed, objective heat scale every word uses.
export function StumbleMapsSection() {
  const wordStumbleCounts = useProgressStore((state) => state.wordStumbleCounts);
  const memorizedEntities = useProgressStore((state) => state.memorizedEntities);

  const chapterGroups = new Map<string, { book: string; chapter: number; verses: StumbleVerseEntry[]; total: number }>();
  for (const [key, counts] of Object.entries(wordStumbleCounts)) {
    const total = counts.reduce((sum, count) => sum + count, 0);
    if (total === 0) continue;
    const { book, chapter, verseNumber } = parseVerseKey(key);
    const groupKey = `${book}|${chapter}`;
    const group = chapterGroups.get(groupKey) ?? { book, chapter, verses: [], total: 0 };
    group.verses.push({ verseNumber, counts, version: resolveVersion(memorizedEntities, book, chapter, verseNumber) });
    group.total += total;
    chapterGroups.set(groupKey, group);
  }
  const rows = Array.from(chapterGroups.values())
    .map((group) => ({ ...group, verses: group.verses.sort((a, b) => a.verseNumber - b.verseNumber) }))
    .sort((a, b) => b.total - a.total);

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-brand-50 p-5 shadow-sm dark:border dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-500 text-white">
          <Flame size={15} />
        </span>
        <p className="flex items-center gap-1.5 text-caption font-semibold uppercase tracking-wide text-brand-500">
          Stumble Maps <InfoTip text={INFO_TIPS.stumbleMapsSection} />
        </p>
      </div>
      {rows.length === 0 ? (
        <p className="text-xs text-ink-muted">Nothing tracked yet — a Stumble Map appears here once you&apos;ve reviewed a verse at least once.</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {rows.map((row) => (
            <StumbleMapChapterRow key={`${row.book}|${row.chapter}`} book={row.book} chapter={row.chapter} verses={row.verses} />
          ))}
        </ul>
      )}
    </div>
  );
}
