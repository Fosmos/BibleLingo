"use client";

import type { CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { useProgressStore } from "@/store/useProgressStore";
import { parsePathKey, resolvePathLabel } from "@/lib/memorizationContent";
import { PATH_TYPE_META, pathKicker } from "@/lib/pathTypeMeta";
import { summarizePath } from "@/lib/pathCardSummary";
import { trailHref } from "@/lib/readerHref";

interface PathHomeCardProps {
  pathKey: string;
}

// One path in progress on Home (design_handoff_path_picker → Path card): its type, translation and
// pace, how far along it is, what's next and what's due — tapping it focuses it and opens its trail.
export function PathHomeCard({ pathKey }: PathHomeCardProps) {
  const router = useRouter();
  const plan = useProgressStore((state) => state.paths[pathKey]);
  const entities = useProgressStore((state) => state.memorizedEntities);
  const setActivePath = useProgressStore((state) => state.setActivePath);
  const { kind } = parsePathKey(pathKey);
  const meta = PATH_TYPE_META[kind];
  if (!plan || !meta) return null;
  const summary = summarizePath(pathKey, plan, entities);
  const Icon = meta.icon;
  const open = () => {
    setActivePath(pathKey);
    router.push(trailHref(pathKey, plan.version));
  };

  return (
    <button type="button" onClick={open} className="flex flex-col gap-3 rounded-[28px] bg-[#FEFDFB] px-4 pb-4 pt-3.5 text-left shadow-organic-sm transition-transform active:scale-[.98] dark:bg-zinc-900">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sage-200 text-sage-900">
          <Icon size={20} strokeWidth={2.75} />
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-[10.5px] font-extrabold uppercase tracking-[.08em] text-sand-700 dark:text-zinc-400">{pathKicker(kind, plan.version, plan.versesPerDay)}</span>
          <span className="truncate font-heading text-xl leading-tight text-ink dark:text-zinc-100">{resolvePathLabel(pathKey) ?? pathKey}</span>
        </div>
        {summary.finished ? (
          <span className="flex items-center gap-1 whitespace-nowrap rounded-full bg-sage-900 px-2.5 py-1 text-[11px] font-extrabold text-white">
            <Check size={12} strokeWidth={3} /> Memorized
          </span>
        ) : (
          summary.due > 0 && <span className="whitespace-nowrap rounded-full bg-brand-100 px-2.5 py-1 text-[11px] font-extrabold text-brand-900">{summary.due} due</span>
        )}
      </div>
      <div className="flex items-center gap-2.5">
        <div style={{ "--fill": `${summary.percent}%` } as CSSProperties} className="h-2 flex-1 overflow-hidden rounded-full bg-sand-200 dark:bg-zinc-800">
          <div className="h-full w-[var(--fill)] rounded-full bg-sage-600" />
        </div>
        <span className="text-xs font-extrabold text-sage-800 dark:text-sage-300">{summary.percent}%</span>
      </div>
      {!summary.finished && summary.next && (
        <div className="flex items-center gap-2">
          <span className="min-w-0 flex-1 truncate text-[13px] font-bold text-sand-700 dark:text-zinc-400">
            Next: <span className="text-ink dark:text-zinc-100">{summary.next}</span>
          </span>
          <span className="whitespace-nowrap rounded-full bg-brand-500 px-4 py-2 text-[13px] font-extrabold text-white">Continue</span>
        </div>
      )}
    </button>
  );
}
