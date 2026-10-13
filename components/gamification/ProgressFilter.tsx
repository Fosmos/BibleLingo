import type { ProgressFilter as Filter } from "@/lib/bibleProgress";

interface ProgressFilterProps {
  heading: string;
  value: Filter;
  onChange: (value: Filter) => void;
}

const OPTIONS: [Filter, string][] = [
  ["all", "All"],
  ["due", "Due"],
  ["known", "Known"],
];

// The list heading ("Books" / "Chapters") beside the All · Due · Known filter.
export function ProgressFilter({ heading, value, onChange }: ProgressFilterProps) {
  return (
    <div className="flex items-center gap-3">
      <h2 className="flex-1 font-heading text-xl text-ink dark:text-zinc-100">{heading}</h2>
      <div role="radiogroup" aria-label="Filter" className="flex rounded-full bg-sand-200 p-1 dark:bg-zinc-800">
        {OPTIONS.map(([option, label]) => (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={value === option}
            onClick={() => onChange(option)}
            className={`rounded-full px-3 py-1.5 text-xs font-extrabold ${
              value === option ? "bg-[#FEFDFB] text-ink shadow-organic-sm dark:bg-zinc-900 dark:text-zinc-100" : "text-sand-700 dark:text-zinc-400"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
