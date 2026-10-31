"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { useProgressStore } from "@/store/useProgressStore";
import { useAuthStore } from "@/store/useAuthStore";
import { summarizePath } from "@/lib/pathCardSummary";
import { useActivePathKeys } from "@/lib/useActivePathKeys";
import { HomeLearnButton } from "@/components/gamification/HomeLearnButton";
import { HomeDueButton } from "@/components/gamification/HomeDueButton";
import { PathHomeCard } from "@/components/gamification/PathHomeCard";
import { StreakCounter } from "@/components/gamification/StreakCounter";

// Home: a "Welcome back", today's lesson, what's due, then your paths, the most recently opened first.
export function PathHomeList() {
  const keys = useActivePathKeys();
  const username = useAuthStore((state) => state.currentUsername);
  const focused = useProgressStore((state) => state.activePathKey);
  const paths = useProgressStore((state) => state.paths);
  const entities = useProgressStore((state) => state.memorizedEntities);
  const ordered = focused && keys.includes(focused) ? [focused, ...keys.filter((key) => key !== focused)] : keys;

  const today = ordered.find((key) => {
    const plan = paths[key];
    return plan && !summarizePath(key, plan, entities).finished;
  });

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-center gap-3">
        <h1 className="min-w-0 flex-1 break-words font-heading text-[30px] leading-[1.1] text-ink dark:text-zinc-100">{username ? `Welcome back, ${username}` : "Welcome back"}</h1>
        <StreakCounter pill />
      </header>
      {today && <HomeLearnButton pathKey={today} />}
      <HomeDueButton />
      <section className="flex flex-col">
        {ordered.length > 0 && <h2 className="pb-1.5 text-base font-extrabold text-ink dark:text-zinc-100">Your paths</h2>}
        {ordered.map((key) => (
          <PathHomeCard key={key} pathKey={key} />
        ))}
        <Link href="/begin" className="flex min-h-[54px] items-center justify-between border-t border-sand-200 text-[15px] font-extrabold text-sand-800 dark:border-zinc-900 dark:text-zinc-300">
          Start a new path
          <Plus size={18} strokeWidth={2.75} />
        </Link>
      </section>
    </div>
  );
}
