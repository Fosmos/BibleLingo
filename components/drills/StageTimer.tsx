"use client";

import { useEffect, useState } from "react";
import { Timer } from "lucide-react";

interface StageTimerProps {
  // When the clock started (the first key), and stopped (the last word) — null until then.
  startedAt: number | null;
  stoppedAt: number | null;
  // The time allowed — the clock counts down from it.
  limitMs: number;
  // The last try ran out of time, so the verse started over (FirstLetterBlankRep.tsx).
  timedOut?: boolean;
}

const format = (ms: number) => {
  const tenths = Math.max(0, Math.ceil(ms / 100));
  const minutes = Math.floor(tenths / 600);
  const seconds = Math.floor((tenths % 600) / 10);
  return `${minutes}:${String(seconds).padStart(2, "0")}.${tenths % 10}`;
};

// The countdown on the Against the clock stage: the full time until the first key, then counting
// down, then holding what was left. Run out and the verse starts over — "Time's up, try again".
export function StageTimer({ startedAt, stoppedAt, limitMs, timedOut = false }: StageTimerProps) {
  const [now, setNow] = useState(() => Date.now());
  const running = startedAt !== null && stoppedAt === null;
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(id);
  }, [running]);
  const elapsed = startedAt === null ? 0 : (stoppedAt ?? Math.max(now, startedAt)) - startedAt;
  const left = limitMs - elapsed;
  const timeUp = timedOut && startedAt === null;

  return (
    <div className={`flex items-center justify-center gap-2 self-center rounded-full px-4 py-1.5 ${timeUp ? "bg-heart-100 dark:bg-heart-500/20" : "bg-sand-200 dark:bg-zinc-800"}`} role="timer" aria-live="off">
      <Timer size={16} strokeWidth={2.5} className={timeUp ? "text-heart-500" : "text-brand-500"} />
      <span className={`font-mono text-lg font-bold tabular-nums ${timeUp ? "text-heart-500" : "text-ink dark:text-zinc-100"}`}>{format(left)}</span>
      {timeUp && <span className="text-xs font-extrabold uppercase tracking-wide text-heart-500">Time&apos;s up — try again</span>}
      {startedAt === null && !timeUp && <span className="text-xs font-semibold text-ink-muted">starts with your first letter</span>}
      {stoppedAt !== null && !timeUp && <span className="text-xs font-extrabold uppercase tracking-wide text-sage-800 dark:text-sage-300">Done</span>}
    </div>
  );
}
