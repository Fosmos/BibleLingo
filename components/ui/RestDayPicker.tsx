"use client";

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

interface RestDayPickerProps {
  value: number | null;
  onChange: (value: number | null) => void;
}

// One optional day-off toggle per week (see UserProgress.restDayOfWeek) — tapping the
// already-selected day clears it back to "no rest day," same single-value-toggle convention
// as a radio group that also allows "none selected."
export function RestDayPicker({ value, onChange }: RestDayPickerProps) {
  return (
    <div className="flex items-center gap-1.5">
      {DAY_LABELS.map((label, day) => {
        const active = value === day;
        return (
          <button
            key={day}
            type="button"
            onClick={() => onChange(active ? null : day)}
            aria-pressed={active}
            aria-label={`Rest day: ${DAY_NAMES[day]}`}
            className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
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
