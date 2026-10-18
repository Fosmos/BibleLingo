"use client";

import { motion } from "framer-motion";
import type { MathProblem } from "@/lib/memoryChallenges";
import { BodyPortal } from "@/components/ui/BodyPortal";

interface MathBreakCardProps {
  problem: MathProblem;
  // The digits typed so far (on the stage's own keyboard), and whether the last try was wrong.
  typed: string;
  error: boolean;
}

// The math problem that pops up between sense lines on the math-break stage — answered on the
// keyboard's number row before the next line's letters can be typed. It floats over the verse,
// leaving the keyboard below free to answer on.
export function MathBreakCard({ problem, typed, error }: MathBreakCardProps) {
  return (
    <BodyPortal>
      <div
        className="pointer-events-none fixed inset-x-0 top-[14%] z-[55] flex justify-center px-4"
        role="dialog"
        aria-label="Math break"
      >
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={
            error
              ? { scale: 1, opacity: 1, x: [0, -8, 8, -5, 5, 0] }
              : { scale: 1, opacity: 1 }
          }
          transition={{ type: "spring", stiffness: 320, damping: 22, x: { type: "tween", duration: 0.35 } }}
          className="pointer-events-auto flex w-full max-w-xs flex-col items-center gap-3 rounded-[28px] bg-paper px-6 py-6 text-center shadow-organic-lg dark:bg-zinc-900"
        >
          <span className="text-[11px] font-black uppercase tracking-[.1em] text-sage-800 dark:text-sage-300">
            Quick! Solve this
          </span>
          <span className="font-heading text-[40px] leading-none text-ink dark:text-zinc-100">
            {problem.text} =
          </span>
          <span
            className={`min-w-[4ch] border-b-4 pb-1 font-mono text-[34px] font-bold tabular-nums ${error ? "border-heart-500 text-heart-500" : "border-brand-500 text-brand-700 dark:text-brand-300"}`}
          >
            {typed || " "}
          </span>
          <span className="text-xs font-semibold text-ink-muted">
            Type the answer on the number row
          </span>
        </motion.div>
      </div>
    </BodyPortal>
  );
}
