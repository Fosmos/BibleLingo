"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { useProgressStore } from "@/store/useProgressStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useActivePathKeys } from "@/lib/useActivePathKeys";
import { HomeDueButton } from "@/components/gamification/HomeDueButton";
import { PathHomeCard } from "@/components/gamification/PathHomeCard";
import { StreakCounter } from "@/components/gamification/StreakCounter";

// Home: a "Welcome back", what's due, then a card per path in progress, the most recently opened
// (so the next lesson) first, then "Start a new path".
export function PathHomeList() {
  const keys = useActivePathKeys();
  const username = useAuthStore((state) => state.currentUsername);
  const focused = useProgressStore((state) => state.activePathKey);
  const ordered = focused && keys.includes(focused) ? [focused, ...keys.filter((key) => key !== focused)] : keys;

  return (
    <div className="flex flex-col gap-3.5">
      <header className="flex items-center gap-3">
        <h1 className="min-w-0 flex-1 break-words font-heading text-[32px] leading-tight text-ink dark:text-zinc-100">{username ? `Welcome back, ${username}` : "Welcome back"}</h1>
        <StreakCounter pill />
      </header>
      <HomeDueButton />
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
