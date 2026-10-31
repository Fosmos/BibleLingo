"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ChevronUp, PackageOpen } from "lucide-react";
import { MOTION_DURATION, MOTION_EASE } from "@/lib/motionTokens";
import type { RankStanding } from "@/lib/ranks";

interface DuoChestSheetProps {
  unitTitle: string;
  ready: boolean;
  verses: number;
  standing: RankStanding;
  onClose: () => void;
}

// What a unit's chest holds: where finishing it has put you on the rank ladder.
export function DuoChestSheet({ unitTitle, ready, verses, standing, onClose }: DuoChestSheetProps) {
  const still = useReducedMotion();
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-ink/50" />
      <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} transition={{ duration: MOTION_DURATION.base, ease: MOTION_EASE.enter }} className="relative flex flex-col items-center gap-2 rounded-t-[32px] bg-paper px-[22px] pb-[calc(1.9rem+env(safe-area-inset-bottom))] pt-5 text-center shadow-organic-lg dark:bg-zinc-950">
        {ready ? (
          <>
            <motion.span initial={still ? false : { scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 240, damping: 13 }} className="flex h-24 w-24 items-center justify-center rounded-full bg-[#F5B83D] text-[#4A3205] shadow-[0_0_40px_#F5B83D]">
              <PackageOpen size={48} strokeWidth={2} />
            </motion.span>
            <span className="pt-2 text-xs font-extrabold uppercase tracking-wider text-sand-700 dark:text-zinc-400">{unitTitle} complete</span>
            <h2 className="font-heading text-[28px] leading-tight text-ink dark:text-zinc-100">{verses} verses by heart</h2>
            <p className="font-bold text-ink dark:text-zinc-100">Rank: {standing.rank.title}</p>
            {standing.next && (
              <p className="flex items-center gap-1 text-sm font-bold text-sand-700 dark:text-zinc-400">
                <ChevronUp aria-hidden="true" size={15} strokeWidth={3} />
                {standing.toNext} more to rise to {standing.next.title}
              </p>
            )}
          </>
        ) : (
          <>
            <h2 className="font-heading text-[26px] leading-tight text-ink dark:text-zinc-100">Chest locked</h2>
            <p className="text-sm font-bold text-sand-700 dark:text-zinc-400">Finish every stop in {unitTitle} to open this.</p>
          </>
        )}
        <button type="button" onClick={onClose} className="mt-3 w-full rounded-full bg-sand-200 py-4 text-base font-extrabold text-ink hover:bg-sand-300 dark:bg-zinc-800 dark:text-zinc-100">
          {ready ? "Keep going" : "Got it"}
        </button>
      </motion.div>
    </div>
  );
}
