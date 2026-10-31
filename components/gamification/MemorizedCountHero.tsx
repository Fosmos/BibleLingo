"use client";

import type { CSSProperties } from "react";
import { milestoneView } from "@/lib/memorizedLibrary";

interface MemorizedCountHeroProps {
  verses: number;
}

// The Memorized tab's hero (design option 2a/4b's top half): the verse total huge on a terracotta
// card, a bar toward the next milestone, and the milestone chips around it. (Your rank shows in
// Profile — RankCard.tsx.)
export function MemorizedCountHero({ verses }: MemorizedCountHeroProps) {
  const { goal, toGo, pct, chips } = milestoneView(verses);
  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-heading text-[34px] leading-[1.1] text-ink dark:text-zinc-100">Memorized</h1>
      <div className="relative flex flex-col gap-3.5 overflow-hidden rounded-[24px] bg-[#A85A26] p-5 text-white shadow-[0_6px_0_#7A3F18]">
        <span aria-hidden className="pointer-events-none absolute -right-9 -top-9 h-[150px] w-[150px] rounded-full bg-[#BC7242]" />
        <span className="relative flex items-center gap-3">
          <span className="font-heading text-[64px] leading-none">{verses}</span>
          <span className="text-[17px] font-extrabold leading-tight">
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
            className="h-3 overflow-hidden rounded-md bg-[#7A3F18]"
          >
            <span style={{ "--pct": `${pct}%` } as CSSProperties} className="block h-full w-[var(--pct)] rounded-md bg-white transition-[width] duration-500" />
          </div>
          <span className="flex flex-wrap gap-1.5">
            {chips.map((chip) => (
              <span
                key={chip.value}
                className={`rounded-[10px] px-[9px] py-1 text-[11.5px] font-black ${chip.reached ? "bg-white text-[#7A3F18]" : "bg-[#7A3F18] text-white"}`}
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
