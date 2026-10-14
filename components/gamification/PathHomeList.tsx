"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { useProgressStore } from "@/store/useProgressStore";
import { useActivePathKeys } from "@/lib/useActivePathKeys";
import { isDue } from "@/lib/srs";
import { PathHomeCard } from "@/components/gamification/PathHomeCard";
import { StreakCounter } from "@/components/gamification/StreakCounter";

// Home's "Your paths" (design_handoff_path_picker → Screen 1): a card per path in progress, the
// most recently opened first, then "Start a new path".
export function PathHomeList() {
  const keys = useActivePathKeys();
  const focused = useProgressStore((state) => state.activePathKey);
  const entities = useProgressStore((state) => state.memorizedEntities);
  const ordered = focused && keys.includes(focused) ? [focused, ...keys.filter((key) => key !== focused)] : keys;
  const now = new Date();
  const due = entities.filter((entity) => isDue(entity.srs, now)).length;

  return (
    <div className="flex flex-col gap-3.5">
      <header className="relative flex items-start gap-3">
        <span aria-hidden="true" className="pointer-events-none absolute -right-[110px] -top-[90px] -z-10 h-[300px] w-[300px] rounded-full bg-sage-200/70 dark:bg-sage-900/40" />
        <span aria-hidden="true" className="pointer-events-none absolute -right-10 top-[70px] -z-10 h-[120px] w-[120px] rounded-full bg-brand-200/80 dark:bg-brand-900/40" />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="text-xs font-extrabold uppercase tracking-[.08em] text-sage-800 dark:text-sage-300">
            {ordered.length} {ordered.length === 1 ? "path" : "paths"} in progress
          </span>
          <h1 className="font-heading text-[40px] leading-none text-ink dark:text-zinc-100">Your paths</h1>
          <span className="text-sm font-bold text-sand-700 dark:text-zinc-400">{due ? `${due} ${due === 1 ? "review" : "reviews"} due today` : "All caught up on reviews"}</span>
        </div>
        <StreakCounter pill className="mt-1.5" />
      </header>
      {ordered.map((key) => (
        <PathHomeCard key={key} pathKey={key} />
      ))}
      <Link href="/begin" className="flex items-center gap-3 rounded-[28px] border-[2.5px] border-dashed border-sand-400 p-4 hover:bg-sand-100 dark:border-zinc-700 dark:hover:bg-zinc-900">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-500 text-white">
          <Plus size={22} strokeWidth={2.75} />
        </span>
        <span className="flex flex-col">
          <span className="font-heading text-[19px] leading-tight text-ink dark:text-zinc-100">Start a new path</span>
          <span className="text-[13px] font-bold text-sand-700 dark:text-zinc-400">A verse, chapter, book or topic</span>
        </span>
      </Link>
    </div>
  );
}
