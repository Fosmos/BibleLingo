interface ThresholdSliderProps {
  value: number;
  onChange: (value: number) => void;
  label: string;
  description?: string;
  min?: number;
  max?: number;
}

// A single percentage slider — a native range input (its thumb position is a browser-drawn
// affordance, not something this needs to compute/style itself) colored via Tailwind's
// accent-* utility rather than a custom-styled track/thumb.
export function ThresholdSlider({ value, onChange, label, description, min = 0, max = 100 }: ThresholdSliderProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm font-medium text-ink-soft dark:text-zinc-300">{label}</span>
        <span className="text-sm font-semibold text-brand-600 dark:text-brand-400">{value}%</span>
      </div>
      {description && <span className="text-xs text-ink-muted">{description}</span>}
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        aria-label={label}
        className="mt-1 h-2 w-full cursor-pointer appearance-none rounded-full bg-mist accent-brand-500 dark:bg-zinc-700"
      />
    </div>
  );
}
