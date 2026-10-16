"use client";

import { useState, type CSSProperties } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useProgressStore } from "@/store/useProgressStore";
import { computeMemorizedStats } from "@/lib/progressSummary";
import { RANKS, rankStanding } from "@/lib/ranks";
import { useHasMounted } from "@/lib/useHasMounted";
import { RankBadge } from "@/components/gamification/RankBadge";

// Profile's rank (lib/ranks.ts): the one the verses memorized have earned, the line of Scripture
// that names it, progress up to the next — and, opened, the whole ladder as a climb: the top rank
// first, each one up from the one under it, earned ranks lit and "You" beside the current one.
export function RankCard() {
  const mounted = useHasMounted();
  const entities = useProgressStore((state) => state.memorizedEntities);
  const [open, setOpen] = useState(false);
  const verses = mounted ? computeMemorizedStats(entities).verses : 0;
  const standing = rankStanding(verses);

  return (
    <section className="flex flex-col gap-2.5">
      <h2 className="text-[22px] text-ink dark:text-zinc-100">Rank</h2>
      <div className="flex flex-col gap-4 rounded-organic bg-sand-100 p-[18px] dark:bg-zinc-900">
        <div className="flex items-center gap-4">
          <RankBadge index={standing.index} size="lg" />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="text-[11px] font-black uppercase tracking-[.08em] text-sage-800 dark:text-sage-300">
              Rank {standing.index + 1} of {RANKS.length} · {verses.toLocaleString()} {verses === 1 ? "verse" : "verses"}
            </span>
            <span className="font-heading text-[26px] leading-tight text-ink dark:text-zinc-100">{standing.rank.title}</span>
          </div>
        </div>
        <p className="flex flex-col gap-0.5">
          <span className="font-serif text-[16px] leading-snug text-brand-800 dark:text-brand-200">“{standing.rank.verse}”</span>
          <span className="text-xs font-extrabold uppercase tracking-[.06em] text-sand-700 dark:text-zinc-400">{standing.rank.reference}</span>
        </p>
        {standing.next && (
          <div className="flex flex-col gap-1.5">
            <span className="h-2.5 overflow-hidden rounded-full bg-sand-300 dark:bg-zinc-700">
              <span style={{ "--rank": `${standing.pct}%` } as CSSProperties} className="block h-full w-[var(--rank)] rounded-full bg-brand-500" />
            </span>
            <span className="flex items-center gap-1 text-xs font-extrabold text-ink-muted">
              <ChevronUp size={14} strokeWidth={3} className="text-brand-500" />
              {standing.toNext} more {standing.toNext === 1 ? "verse" : "verses"} to rise to {standing.next.title}
            </span>
          </div>
        )}
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
          className="flex items-center justify-between rounded-2xl border-2 border-sand-300 px-3.5 py-2.5 text-[13px] font-black uppercase tracking-[.06em] text-ink hover:bg-sand-200/60 dark:border-zinc-700 dark:text-zinc-100"
        >
          All ranks
          <ChevronDown size={18} strokeWidth={2.75} className={`transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
        {open && (
          <ol className="flex flex-col" aria-label="Ranks, highest first">
            {RANKS.map((rank, index) => ({ rank, index }))
              .reverse()
              .map(({ rank, index }) => {
                const locked = index > standing.index;
                const current = index === standing.index;
                return (
                  <li key={rank.title} className="flex flex-col">
                    <div className={`flex items-center gap-3 rounded-2xl px-2 py-1.5 ${current ? "bg-brand-100 dark:bg-brand-900/30" : ""}`}>
                      <RankBadge index={index} size="sm" locked={locked} />
                      <span className={`min-w-0 flex-1 truncate text-[15px] font-black ${locked ? "text-sand-500 dark:text-zinc-500" : "text-ink dark:text-zinc-100"}`}>
                        {rank.title}
                      </span>
                      {current && <span className="shrink-0 rounded-lg bg-brand-500 px-2 py-0.5 text-[10.5px] font-black uppercase tracking-[.06em] text-white">You</span>}
                      <span className="w-12 shrink-0 text-right text-xs font-extrabold text-ink-muted">{rank.min.toLocaleString()}</span>
                    </div>
                    {index > 0 && <ChevronUp aria-hidden="true" size={14} strokeWidth={3} className={`ml-[17px] ${locked ? "text-sand-300 dark:text-zinc-700" : "text-brand-400"}`} />}
                  </li>
                );
              })}
          </ol>
        )}
      </div>
    </section>
  );
}
