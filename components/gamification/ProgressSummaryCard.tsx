import type { CSSProperties } from "react";
import { percentLabel } from "@/lib/bibleProgress";
import type { MemorizedStats } from "@/lib/progressSummary";
import { StatCircle, STAT_CIRCLE_CLASSES } from "@/components/gamification/StatCircle";

interface ProgressSummaryCardProps {
  known: number;
  due: number;
  total: number;
  // Books, chapters and verses fully memorized, as on the Memorized page.
  stats: MemorizedStats;
  // Book level: no Books circle (it's one book) — just its chapters and verses.
  showBooks?: boolean;
}

// The Bible and Book levels' progress card: a ring (known in sage, due in terracotta, the rest
// neutral — each non-zero arc at least 1.5% so it shows) and the Memorized page's stat circles,
// all one size in a row that fills the card.
export function ProgressSummaryCard({ known, due, total, stats, showBooks = true }: ProgressSummaryCardProps) {
  const arc = (value: number) => (value > 0 ? Math.max(1.5, (value / Math.max(total, 1)) * 100) : 0);
  const knownArc = arc(known - due);
  const dueArc = Math.min(100 - knownArc, arc(due));
  const ring = { "--a": `${knownArc}%`, "--b": `${knownArc + dueArc}%` } as CSSProperties;
  return (
    <section className={`grid items-center gap-2.5 rounded-[32px] bg-[#FEFDFB] p-4 shadow-organic-sm dark:bg-zinc-900 ${showBooks ? "grid-cols-4" : "grid-cols-3"}`}>
      <div
        style={ring}
        className="relative aspect-square w-full rounded-full bg-[conic-gradient(#728157_0_var(--a),#C67139_var(--a)_var(--b),#EEE7DB_var(--b)_100%)] dark:bg-[conic-gradient(#728157_0_var(--a),#C67139_var(--a)_var(--b),#3f3f46_var(--b)_100%)]"
      >
        <div className="absolute inset-[13%] flex flex-col items-center justify-center rounded-full bg-[#FEFDFB] dark:bg-zinc-900">
          <span className="font-heading text-base leading-none text-ink dark:text-zinc-100">{percentLabel(known, total)}</span>
          <span className="text-[9px] font-extrabold uppercase tracking-[.06em] text-sand-700 dark:text-zinc-400">Known</span>
        </div>
      </div>
      {showBooks && <StatCircle compact label={stats.books === 1 ? "Book" : "Books"} value={stats.books} className={STAT_CIRCLE_CLASSES.books} />}
      <StatCircle compact label={stats.chapters === 1 ? "Chapter" : "Chapters"} value={stats.chapters} className={STAT_CIRCLE_CLASSES.chapters} />
      <StatCircle compact label={stats.verses === 1 ? "Verse" : "Verses"} value={stats.verses} className={STAT_CIRCLE_CLASSES.verses} />
    </section>
  );
}
