import type { CSSProperties } from "react";
import { Check } from "lucide-react";
import { percentLabel } from "@/lib/bibleProgress";

interface ProgressSummaryCardProps {
  known: number;
  due: number;
  total: number;
  started: number;
  of: number;
  unit: "books" | "chapters";
  complete?: boolean;
}

// The Bible and Book levels' progress card: a ring (known in sage, due in terracotta, the rest
// neutral — each non-zero arc at least 1.5% so it shows) beside the known-verse count.
export function ProgressSummaryCard({ known, due, total, started, of, unit, complete }: ProgressSummaryCardProps) {
  const arc = (value: number) => (value > 0 ? Math.max(1.5, (value / Math.max(total, 1)) * 100) : 0);
  const knownArc = arc(known - due);
  const dueArc = Math.min(100 - knownArc, arc(due));
  const ring = { "--a": `${knownArc}%`, "--b": `${knownArc + dueArc}%` } as CSSProperties;
  return (
    <section className="flex items-center gap-5 rounded-[32px] bg-[#FEFDFB] p-5 shadow-organic-sm dark:bg-zinc-900">
      <div style={ring} className="flex h-[92px] w-[92px] shrink-0 items-center justify-center rounded-full bg-[conic-gradient(#728157_0_var(--a),#C67139_var(--a)_var(--b),#EEE7DB_var(--b)_100%)] dark:bg-[conic-gradient(#728157_0_var(--a),#C67139_var(--a)_var(--b),#3f3f46_var(--b)_100%)]">
        <div className="flex h-[70px] w-[70px] flex-col items-center justify-center rounded-full bg-[#FEFDFB] dark:bg-zinc-900">
          <span className="font-heading text-lg leading-none text-ink dark:text-zinc-100">{percentLabel(known, total)}</span>
          <span className="text-[9px] font-extrabold uppercase tracking-[.06em] text-sand-700 dark:text-zinc-400">Known</span>
        </div>
      </div>
      <div className="flex min-w-0 flex-col gap-1.5">
        <span className="font-heading text-4xl leading-none text-sage-800 dark:text-sage-300">{known.toLocaleString()}</span>
        <span className="whitespace-nowrap text-[13px] font-extrabold text-ink dark:text-zinc-100">of {total.toLocaleString()} verses</span>
        <span className="text-[13px] font-bold text-sand-700 dark:text-zinc-400">
          {started} of {of} {unit} started
        </span>
        {complete && (
          <span className="flex items-center gap-1 self-start rounded-full bg-sage-900 py-[5px] pl-2.5 pr-3 text-xs font-extrabold text-white">
            <Check size={13} strokeWidth={2.75} /> Whole book memorized
          </span>
        )}
      </div>
    </section>
  );
}
