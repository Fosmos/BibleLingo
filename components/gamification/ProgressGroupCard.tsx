import type { CSSProperties, ReactNode } from "react";

interface ProgressGroupCardProps {
  kicker?: string;
  name: string;
  known: number;
  due: number;
  total: number;
  columns: 5 | 6;
  children: ReactNode;
}

// One section (Bible level) or theme (Book level): its name, verses known and due, a progress
// bar, and a grid of tiles.
export function ProgressGroupCard({ kicker, name, known, due, total, columns, children }: ProgressGroupCardProps) {
  const fill = { "--w": known ? `max(6px, ${(known / Math.max(total, 1)) * 100}%)` : "0px" } as CSSProperties;
  return (
    <section className="flex flex-col gap-3.5 rounded-[28px] bg-[#FEFDFB] px-4 pb-4 pt-[18px] shadow-organic-sm dark:bg-zinc-900">
      <div className="flex items-end gap-2">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          {kicker && <span className="text-[11px] font-extrabold uppercase tracking-[.07em] text-sand-700 dark:text-zinc-400">{kicker}</span>}
          <h3 className="font-heading text-[19px] leading-tight text-ink dark:text-zinc-100">{name}</h3>
        </div>
        {known > 0 && <span className="whitespace-nowrap text-xs font-extrabold text-sage-800 dark:text-sage-300">{known} verses</span>}
        {due > 0 && <span className="whitespace-nowrap rounded-full bg-brand-100 px-[9px] py-[3px] text-[11px] font-extrabold text-brand-900">{due} due</span>}
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-sand-200 dark:bg-zinc-800">
        <div style={fill} className="h-full w-[var(--w)] rounded-full bg-sage-600" />
      </div>
      <div className={`grid gap-x-2 gap-y-3 ${columns === 6 ? "grid-cols-6" : "grid-cols-5"} justify-items-center`}>{children}</div>
    </section>
  );
}
