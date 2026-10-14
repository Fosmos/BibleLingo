"use client";

import { Minus, Plus } from "lucide-react";
import { PathOptionRow } from "@/components/gamification/PathOptionRow";

interface PaceStepperProps {
  // Empty while the reader is typing.
  value: number | "";
  onChange: (value: number | "") => void;
  totalVerses: number;
}

const QUICK = [1, 2, 3, 5];
const SUGGESTED = 2;

// "Finish in about 3 weeks" — days up to 13, weeks up to 60, months after.
export function paceDuration(totalVerses: number, pace: number): string {
  const days = Math.ceil(totalVerses / pace);
  if (days <= 13) return `${days} ${days === 1 ? "day" : "days"}`;
  if (days <= 60) return `${Math.round(days / 7)} weeks`;
  return `${Math.round(days / 30)} months`;
}

// Setup's pace step (design_handoff_path_picker → Pace stepper): a typed number of new verses a
// day between − and + (1–50), the finish estimate under it, and quick picks below.
export function PaceStepper({ value, onChange, totalVerses }: PaceStepperProps) {
  const clamp = (next: number) => Math.min(50, Math.max(1, next));
  const step = (by: number) => onChange(clamp((value === "" ? SUGGESTED : value) + by));
  const round = "flex h-[52px] w-[52px] items-center justify-center rounded-full bg-sand-200 text-ink hover:bg-sand-300 dark:bg-zinc-800 dark:text-zinc-100";
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col items-center gap-1 rounded-[32px] bg-[#FEFDFB] px-[18px] py-5 shadow-organic-sm dark:bg-zinc-900">
        <div className="flex items-center gap-4">
          <button type="button" onClick={() => step(-1)} aria-label="Fewer" className={round}>
            <Minus size={22} strokeWidth={2.75} />
          </button>
          <input
            type="number"
            inputMode="numeric"
            value={value}
            onChange={(event) => onChange(event.target.value === "" ? "" : clamp(Number(event.target.value)))}
            aria-label="New verses a day"
            className="w-[110px] border-b-[3px] border-sand-300 bg-transparent text-center font-heading text-[56px] leading-none text-ink outline-none [appearance:textfield] dark:border-zinc-700 dark:text-zinc-100 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          <button type="button" onClick={() => step(1)} aria-label="More" className={round}>
            <Plus size={22} strokeWidth={2.75} />
          </button>
        </div>
        <span className="text-[15px] font-extrabold text-ink dark:text-zinc-100">{value === 1 ? "verse a day" : "verses a day"}</span>
        <span className="text-[13px] font-bold text-sage-800 dark:text-sage-300">{value === "" ? "Enter a number" : `Finish in about ${paceDuration(totalVerses, value)}`}</span>
      </div>
      <span className="pt-1 text-xs font-extrabold uppercase tracking-[.06em] text-sand-700 dark:text-zinc-400">Or pick one</span>
      {QUICK.map((pick) => (
        <PathOptionRow key={pick} title={`${pick} ${pick === 1 ? "verse" : "verses"} a day`} meta={`Finish in about ${paceDuration(totalVerses, pick)}`} suggested={pick === SUGGESTED} selected={value === pick} onSelect={() => onChange(pick)} />
      ))}
    </div>
  );
}
