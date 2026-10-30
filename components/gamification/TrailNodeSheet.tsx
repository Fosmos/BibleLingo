"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import type { TrailStop } from "@/lib/trailStops";
import { parseToSenseLines } from "@/lib/senseLines";
import { MOTION_DURATION, MOTION_EASE } from "@/lib/motionTokens";

interface TrailNodeSheetProps {
  stop: TrailStop;
  sectionTitle: string;
  pathLabel: string;
  onClose: () => void;
  onStart: () => void;
  onReview: () => void;
  onPractise: () => void;
  // Extra details about the stop, above its action.
  children?: ReactNode;
}

// What a tapped trail stop offers (design_handoff_path_picker → Stop sheet): start it when it's up
// next, review it when it's due, practise it again once learned — or, locked, nothing yet.
export function TrailNodeSheet({ stop, sectionTitle, pathLabel, onClose, onStart, onReview, onPractise, children }: TrailNodeSheetProps) {
  const due = stop.state === "done" && stop.dueIds.length > 0;
  const tag = stop.state === "current" ? "Up next" : due ? "Due for review" : stop.state === "done" ? "Memorized" : "Locked";
  const tagClass = stop.state === "current" || due ? "bg-brand-100 text-brand-900" : stop.state === "done" ? "bg-sage-200 text-sage-900" : "bg-sand-200 text-sand-800";
  const primary = "w-full rounded-full bg-brand-500 py-4 text-base font-extrabold text-white shadow-[0_6px_0_#8C491A] hover:bg-brand-600";
  const secondary = "w-full rounded-full bg-sand-200 py-4 text-base font-extrabold text-ink hover:bg-sand-300 dark:bg-zinc-800 dark:text-zinc-100";
  const preview = stop.verses.length === 1 && stop.state !== "locked" ? stop.verses[0] : null;
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-ink/35" />
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        transition={{ duration: MOTION_DURATION.base, ease: MOTION_EASE.enter }}
        className="relative flex flex-col gap-2.5 rounded-t-[32px] bg-paper px-[22px] pb-[calc(1.9rem+env(safe-area-inset-bottom))] pt-3.5 shadow-organic-lg dark:bg-zinc-950"
      >
        <span aria-hidden="true" className="mx-auto mb-1 h-[5px] w-10 rounded-full bg-sand-300 dark:bg-zinc-700" />
        <span className={`self-start rounded-full px-2.5 py-1 text-[11px] font-extrabold ${tagClass}`}>{tag}</span>
        <h2 className="font-heading text-[26px] leading-tight text-ink dark:text-zinc-100">{stop.title}</h2>
        <p className="text-sm font-bold text-sand-700 dark:text-zinc-400">
          {sectionTitle} · {pathLabel}
        </p>
        {preview && (
          <div className="flex flex-col gap-1 rounded-[20px] bg-[#FEFDFB] p-4 text-[15px] leading-[1.55] text-ink dark:bg-zinc-900 dark:text-zinc-100">
            {parseToSenseLines(preview.text).map((line, index) => (
              <p key={index}>{line}</p>
            ))}
          </div>
        )}
        {children}
        <div className="pt-2">
          {stop.state === "current" && (
            <button type="button" onClick={onStart} className={primary}>
              {stop.review ? "Start review" : stop.checkpoint && !stop.verse ? "Start recital" : "Start lesson"}
            </button>
          )}
          {due && (
            <button type="button" onClick={onReview} className={primary}>
              Review now
            </button>
          )}
          {stop.state === "done" && !due && (
            <button type="button" onClick={onPractise} className={secondary}>
              {stop.review ? "Review again" : "Practise again"}
            </button>
          )}
          {stop.state === "locked" && (
            <button type="button" onClick={onClose} className={secondary}>
              Finish earlier steps first
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
