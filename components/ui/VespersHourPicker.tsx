"use client";

const HOUR_OPTIONS: { hour: number | null; label: string }[] = [
  { hour: null, label: "Off" },
  { hour: 20, label: "8 PM" },
  { hour: 21, label: "9 PM" },
  { hour: 22, label: "10 PM" },
  { hour: 23, label: "11 PM" },
];

interface VespersHourPickerProps {
  value: number | null;
  onChange: (value: number | null) => void;
}

// One optional evening wind-down hour (see UserProgress.vespersHour) — same pill-row, single-
// value-with-an-"off"-option convention as RestDayPicker.tsx, just picking an hour instead of
// a day.
export function VespersHourPicker({ value, onChange }: VespersHourPickerProps) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {HOUR_OPTIONS.map(({ hour, label }) => {
        const active = value === hour;
        return (
          <button
            key={label}
            type="button"
            onClick={() => onChange(hour)}
            aria-pressed={active}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              active ? "bg-brand-500 text-white" : "bg-mist text-ink-soft dark:bg-zinc-800 dark:text-zinc-300"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
