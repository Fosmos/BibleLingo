"use client";

import type { FillReps } from "@/types";

interface FillRepsSliderProps {
  value: FillReps;
  onChange: (value: FillReps) => void;
}

// How many Fill in the Blank reps each verse gets in all: 2 (half blanked, then all) or 3.
export function FillRepsSlider({ value, onChange }: FillRepsSliderProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-ink dark:text-zinc-100">Fill in the Blank reps</span>
        <span className="text-xs font-medium text-brand-600">{value} per verse</span>
      </div>
      <input
        type="range"
        min={2}
        max={3}
        step={1}
        value={value}
        onChange={(event) => onChange(Number(event.target.value) === 3 ? 3 : 2)}
        className="w-full accent-brand-500"
        aria-label="Fill in the Blank reps"
      />
      <div className="flex justify-between text-[10px] uppercase tracking-wide text-ink-muted">
        <span>2 reps</span>
        <span>3 reps</span>
      </div>
    </div>
  );
}
