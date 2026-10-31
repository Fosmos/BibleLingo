"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { useProgressStore } from "@/store/useProgressStore";
import { resolvePathLabel } from "@/lib/memorizationContent";
import { summarizePath } from "@/lib/pathCardSummary";
import { trailHref } from "@/lib/readerHref";
import { PathEditSheet } from "@/components/gamification/PathEditSheet";

interface PathHomeCardProps {
  pathKey: string;
}

// One path in progress on Home: its name and how far along it is. Tapping it focuses it and opens
// it; the pencil edits or removes it (PathEditSheet.tsx).
export function PathHomeCard({ pathKey }: PathHomeCardProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const plan = useProgressStore((state) => state.paths[pathKey]);
  const entities = useProgressStore((state) => state.memorizedEntities);
  const setActivePath = useProgressStore((state) => state.setActivePath);
  if (!plan) return null;
  const summary = summarizePath(pathKey, plan, entities);
  const label = resolvePathLabel(pathKey) ?? pathKey;
  const open = () => {
    setActivePath(pathKey);
    router.push(trailHref(pathKey, plan.version));
  };

  return (
    <div className="flex items-center gap-1 border-t border-sand-200 dark:border-zinc-900">
      <button type="button" onClick={open} className="flex min-h-[54px] min-w-0 flex-1 items-center justify-between gap-3 text-left">
        <span className="min-w-0 truncate font-heading text-lg leading-tight text-ink dark:text-zinc-100">{label}</span>
        <span className="shrink-0 text-[13px] font-bold text-ink-muted">{summary.finished ? "Memorized" : `${summary.percent}%`} ›</span>
      </button>
      <button type="button" aria-label={`Edit ${label}`} onClick={() => setEditing(true)} className="-mr-2 flex h-11 w-11 shrink-0 items-center justify-center text-sand-700 dark:text-zinc-400">
        <Pencil size={17} strokeWidth={2.5} />
      </button>
      {editing && <PathEditSheet pathKey={pathKey} onClose={() => setEditing(false)} />}
    </div>
  );
}
