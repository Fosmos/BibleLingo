"use client";

import { BookOpen, ScrollText, Quote, type LucideIcon } from "lucide-react";
import { useProgressStore } from "@/store/useProgressStore";
import { computeMemorizedStats } from "@/lib/progressSummary";

interface StatTileProps {
  label: string;
  value: number;
  icon: LucideIcon;
}

function StatTile({ label, value, icon: Icon }: StatTileProps) {
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-2xl bg-brand-50 p-4 dark:bg-zinc-900">
      <Icon size={18} strokeWidth={1.5} className="text-brand-400 dark:text-brand-600" />
      <span className="text-title text-brand-600">{value}</span>
      <span className="text-caption uppercase tracking-wide text-ink-muted">{label}</span>
    </div>
  );
}

export function MemorizedStats() {
  const memorizedEntities = useProgressStore((state) => state.memorizedEntities);
  const stats = computeMemorizedStats(memorizedEntities);

  return (
    <div className="grid grid-cols-3 gap-3">
      <StatTile label="Chapters" value={stats.chapters} icon={BookOpen} />
      <StatTile label="Verses" value={stats.verses} icon={ScrollText} />
      <StatTile label="Words" value={stats.words} icon={Quote} />
    </div>
  );
}
