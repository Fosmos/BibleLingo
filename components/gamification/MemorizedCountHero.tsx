"use client";

import type { CSSProperties } from "react";
import { milestoneView } from "@/lib/memorizedLibrary";

interface MemorizedCountHeroProps {
  verses: number;
  passages: number;
  books: number;
}

// The Memorized tab's hero (design option 2a/4b's top half): the verse total huge on a terracotta
// card, a bar toward the next milestone, and the milestone chips around it. (Your rank shows in
// Profile — RankCard.tsx.)
export function MemorizedCountHero({ verses, passages, books }: MemorizedCountHeroProps) {
  const { goal, toGo, pct, chips } = milestoneView(verses);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] font-extrabold uppercase tracking-[.08em] text-sage-800">
          {passages} {passages === 1 ? "passage" : "passages"} · {books} {books === 1 ? "book" : "books"}
        </span>
        <h1 className="font-heading text-[40px] leading-[1.05] text-ink dark:text-zinc-100">Memorized</h1>
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
