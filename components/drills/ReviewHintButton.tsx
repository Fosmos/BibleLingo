"use client";

import { Lightbulb } from "lucide-react";

interface ReviewHintButtonProps {
  // How much of the word being typed is showing: 0 nothing, 1 its pill, 2 its first letter too.
  level: number;
  onHint: () => void;
}

const NEXT = ["Show the word's length", "Show its first letter", "Reveal the word"];

// Spaced review's progressive hint for the word being typed (ReviewChain.tsx): each tap shows a
// little more — its pill (how long it is), then its first letter, then the word itself.
export function ReviewHintButton({ level, onHint }: ReviewHintButtonProps) {
  return (
    <button
      type="button"
      onClick={onHint}
      className="flex items-center gap-2 self-center rounded-full border-2 border-sand-300 bg-white px-3.5 py-1.5 text-[13px] font-black text-ink shadow-[0_2px_0_#DCD3C4] active:translate-y-px active:shadow-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
    >
      <Lightbulb size={15} strokeWidth={2.75} className="text-brand-500" />
      Hint
      <span className="text-[12px] font-bold text-ink-muted">· {NEXT[Math.min(level, NEXT.length - 1)]}</span>
      <span aria-hidden="true" className="flex gap-0.5">
        {NEXT.map((_, step) => (
          <span key={step} className={`h-1.5 w-1.5 rounded-full ${step < level ? "bg-brand-500" : "bg-sand-300 dark:bg-zinc-700"}`} />
        ))}
      </span>
    </button>
  );
}
