import type { CSSProperties, ReactNode } from "react";
import { Check } from "lucide-react";

interface PathOptionRowProps {
  title: string;
  meta: string;
  // 0–100 memorized; shown as a ring ("New", "34%", ✓).
  percent?: number;
  suggested?: boolean;
  current?: boolean;
  selected: boolean;
  onSelect: () => void;
  trailing?: ReactNode;
}

// A picker / setup option (design_handoff_path_picker): never filled when selected — a dark
// border and a ✓ instead, so nothing shifts — with an optional progress ring and tags.
export function PathOptionRow({ title, meta, percent, suggested, current, selected, onSelect, trailing }: PathOptionRowProps) {
  const ring = { "--p": `${percent ?? 0}%` } as CSSProperties;
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`flex w-full items-center gap-3 rounded-[28px] border-[2.5px] bg-[#FEFDFB] py-3 pl-3 pr-3.5 text-left shadow-organic-sm dark:bg-zinc-900 ${selected ? "border-ink dark:border-zinc-100" : "border-transparent"}`}
    >
      {percent !== undefined && (
        <span style={ring} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[conic-gradient(#728157_0_var(--p),#EEE7DB_0)] dark:bg-[conic-gradient(#728157_0_var(--p),#3f3f46_0)]">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FEFDFB] text-[11px] font-black text-sage-800 dark:bg-zinc-900 dark:text-sage-300">
            {percent >= 100 ? <Check size={14} strokeWidth={3.5} /> : percent > 0 ? `${Math.round(percent)}%` : "New"}
          </span>
        </span>
      )}
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate font-heading text-lg leading-tight text-ink dark:text-zinc-100">{title}</span>
        <span className="truncate text-xs font-bold text-sand-700 dark:text-zinc-400">{meta}</span>
      </span>
      {suggested && <span className="whitespace-nowrap rounded-full bg-brand-100 px-2.5 py-1 text-[11px] font-extrabold text-brand-900">Suggested</span>}
      {current && !selected && <span className="whitespace-nowrap rounded-full bg-sage-200 px-2.5 py-1 text-[11px] font-extrabold text-sage-900">Current</span>}
      {trailing}
      {selected && (
        <span className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full bg-ink text-paper dark:bg-zinc-100 dark:text-zinc-900">
          <Check size={15} strokeWidth={3} />
        </span>
      )}
    </button>
  );
}
