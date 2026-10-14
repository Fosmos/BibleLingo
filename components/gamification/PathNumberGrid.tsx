interface PathNumberGridProps {
  count: number;
  selected: number | null;
  // Numbers already memorized (a filled circle) — chapters or verses.
  known?: (number: number) => boolean;
  onSelect: (number: number) => void;
}

// The picker's chapter (or verse) grid, once a book (or chapter) is chosen.
export function PathNumberGrid({ count, selected, known, onSelect }: PathNumberGridProps) {
  return (
    <div className="grid grid-cols-6 gap-2">
      {Array.from({ length: count }, (_, index) => index + 1).map((number) => (
        <button
          key={number}
          type="button"
          onClick={() => onSelect(number)}
          aria-pressed={selected === number}
          className={`flex aspect-square items-center justify-center rounded-full border-[2.5px] font-heading text-base shadow-organic-sm ${
            selected === number ? "border-ink bg-[#FEFDFB] text-ink dark:border-zinc-100 dark:bg-zinc-900 dark:text-zinc-100" : known?.(number) ? "border-transparent bg-sage-200 text-sage-900" : "border-transparent bg-[#FEFDFB] text-ink dark:bg-zinc-900 dark:text-zinc-100"
          }`}
        >
          {number}
        </button>
      ))}
    </div>
  );
}
