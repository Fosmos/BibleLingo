"use client";

import { useRouter } from "next/navigation";
import { useProgressStore } from "@/store/useProgressStore";
import { resolvePathLabel } from "@/lib/memorizationContent";
import { summarizePath } from "@/lib/pathCardSummary";
import { trailHref } from "@/lib/readerHref";

interface PathHomeCardProps {
  pathKey: string;
}

// One path in progress on Home: its name and how far along it is. Tapping it focuses it and opens it.
export function PathHomeCard({ pathKey }: PathHomeCardProps) {
  const router = useRouter();
  const plan = useProgressStore((state) => state.paths[pathKey]);
  const entities = useProgressStore((state) => state.memorizedEntities);
  const setActivePath = useProgressStore((state) => state.setActivePath);
  if (!plan) return null;
  const summary = summarizePath(pathKey, plan, entities);
  const open = () => {
    setActivePath(pathKey);
    router.push(trailHref(pathKey, plan.version));
  };

  return (
    <button type="button" onClick={open} className="flex min-h-[54px] items-center justify-between gap-3 border-t border-sand-200 text-left dark:border-zinc-900">
      <span className="min-w-0 truncate font-heading text-lg leading-tight text-ink dark:text-zinc-100">{resolvePathLabel(pathKey) ?? pathKey}</span>
      <span className="shrink-0 text-[13px] font-bold text-ink-muted">{summary.finished ? "Memorized" : `${summary.percent}%`} ›</span>
    </button>
  );
}
