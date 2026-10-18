"use client";

import { useEffect, useState } from "react";
import { Timer } from "lucide-react";

interface StageTimerProps {
  // When the clock started (the first key), and stopped (the last word) — null until then.
  startedAt: number | null;
  stoppedAt: number | null;
}

const format = (ms: number) => {
  const tenths = Math.floor(ms / 100);
  const minutes = Math.floor(tenths / 600);
  const seconds = Math.floor((tenths % 600) / 10);
  return `${minutes}:${String(seconds).padStart(2, "0")}.${tenths % 10}`;
};

// The clock on the timed first-letter stage: waiting until the first key, then running, then
// holding the finished time.
export function StageTimer({ startedAt, stoppedAt }: StageTimerProps) {
  const [now, setNow] = useState(() => Date.now());
  const running = startedAt !== null && stoppedAt === null;
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(id);
  }, [running]);
  const elapsed = startedAt === null ? 0 : (stoppedAt ?? Math.max(now, startedAt)) - startedAt;

  return (
    <div className="flex items-center justify-center gap-2 self-center rounded-full bg-sand-200 px-4 py-1.5 dark:bg-zinc-800" role="timer" aria-live="off">
      <Timer size={16} strokeWidth={2.5} className="text-brand-500" />
      <span className="font-mono text-lg font-bold tabular-nums text-ink dark:text-zinc-100">{format(elapsed)}</span>
      {startedAt === null && <span className="text-xs font-semibold text-ink-muted">starts with your first letter</span>}
      {stoppedAt !== null && <span className="text-xs font-extrabold uppercase tracking-wide text-sage-800 dark:text-sage-300">Done</span>}
    </div>
  );
}
