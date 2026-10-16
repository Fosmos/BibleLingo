"use client";

import type { CSSProperties } from "react";
import { milestoneView } from "@/lib/memorizedLibrary";
import { RANKS, rankStanding } from "@/lib/ranks";
import { RankBadge } from "@/components/gamification/RankBadge";

interface MemorizedCountHeroProps {
  verses: number;
  passages: number;
  books: number;
}

// The Memorized tab's hero (design option 2a/4b's top half): the verse total huge on a terracotta
// card, a bar toward the next milestone, and the milestone chips around it — with the rank those
// verses have earned (lib/ranks.ts) and how far it is to the next, between the title and the card.
export function MemorizedCountHero({ verses, passages, books }: MemorizedCountHeroProps) {
  const { goal, toGo, pct, chips } = milestoneView(verses);
  const standing = rankStanding(verses);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] font-extrabold uppercase tracking-[.08em] text-sage-800">
          {passages} {passages === 1 ? "passage" : "passages"} · {books} {books === 1 ? "book" : "books"}
        </span>
        <h1 className="font-heading text-[40px] leading-[1.05] text-ink dark:text-zinc-100">Memorized</h1>
      </div>
      <div className="flex items-center gap-3 rounded-[22px] border-2 border-sand-300 bg-sand-100 px-3.5 py-3 shadow-[0_4px_0_#DCD3C4] dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-none">
        <RankBadge index={standing.index} size="md" />
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="flex items-baseline justify-between gap-2">
            <span className="truncate font-heading text-[19px] leading-tight text-ink dark:text-zinc-100">{standing.rank.title}</span>
            <span className="shrink-0 text-[11px] font-black uppercase tracking-[.06em] text-sand-700 dark:text-zinc-400">
              Rank {standing.index + 1} of {RANKS.length}
            </span>
          </span>
          {standing.next ? (
            <>
              <span className="h-2 overflow-hidden rounded-full bg-sand-300 dark:bg-zinc-700">
                <span style={{ "--rank": `${standing.pct}%` } as CSSProperties} className="block h-full w-[var(--rank)] rounded-full bg-brand-500 transition-[width] duration-500" />
              </span>
              <span className="text-xs font-extrabold text-ink-muted">
                ↑ {standing.toNext} more to rise to {standing.next.title}
              </span>
            </>
          ) : (
            <span className="text-xs font-extrabold text-ink-muted">Every rank earned</span>
          )}
        </span>
      </div>
      <div className="relative flex flex-col gap-3.5 overflow-hidden rounded-[26px] bg-brand-500 p-[18px] text-white shadow-[0_6px_0_#8C491A]">
        <span aria-hidden className="pointer-events-none absolute -right-[50px] -top-[60px] h-[170px] w-[170px] rounded-full bg-brand-400 opacity-55" />
        <span className="relative flex items-end gap-2.5">
          <span className="font-heading text-[88px] leading-[.95]">{verses}</span>
          <span className="pb-2.5 text-base font-black leading-tight">
            {verses === 1 ? "verse" : "verses"}
            <br />
            by heart
          </span>
        </span>
        <div className="relative flex flex-col gap-[7px]">
          <span className="flex justify-between text-xs font-black uppercase tracking-[.06em]">
            <span>{toGo} to go</span>
            <span>Goal {goal}</span>
          </span>
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={goal}
            aria-valuenow={verses}
            aria-label={`${verses} of ${goal} verses`}
            className="h-3.5 overflow-hidden rounded-full bg-black/20"
          >
            <span style={{ "--pct": `${pct}%` } as CSSProperties} className="block h-full w-[var(--pct)] rounded-full bg-white transition-[width] duration-500" />
          </div>
          <span className="flex flex-wrap gap-1.5">
            {chips.map((chip) => (
              <span
                key={chip.value}
                className={`rounded-[10px] px-[9px] py-1 text-[11.5px] font-black ${chip.reached ? "bg-white text-brand-800" : "bg-black/15 text-white"}`}
              >
                {chip.reached ? "✓ " : ""}
                {chip.value.toLocaleString()}
              </span>
            ))}
          </span>
        </div>
      </div>
    </div>
  );
}
