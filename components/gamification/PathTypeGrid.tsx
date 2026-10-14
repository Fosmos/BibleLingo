import type { PathKind } from "@/types";
import { PATH_TYPE_META } from "@/lib/pathTypeMeta";

interface PathTypeGridProps {
  value: PathKind;
  onChange: (kind: PathKind) => void;
}

const ORDER: PathKind[] = ["verse", "chapter", "book", "topic"];
const COPY: Record<PathKind, string> = {
  verse: "One verse, step by step until it sticks",
  chapter: "A whole chapter, verse by verse",
  book: "A book, passage by passage",
  topic: "One theme, verses from across the Bible",
};

// The picker's four path types, 2×2 — the chosen one's icon turns terracotta, bordered not filled.
export function PathTypeGrid({ value, onChange }: PathTypeGridProps) {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {ORDER.map((kind) => {
        const { icon: Icon, name } = PATH_TYPE_META[kind];
        const selected = kind === value;
        return (
          <button
            key={kind}
            type="button"
            onClick={() => onChange(kind)}
            aria-pressed={selected}
            className={`flex flex-col gap-3 rounded-[28px] border-[2.5px] bg-[#FEFDFB] p-4 text-left shadow-organic-sm transition-transform active:scale-[.97] dark:bg-zinc-900 ${selected ? "border-ink dark:border-zinc-100" : "border-transparent"}`}
          >
            <span className={`flex h-[42px] w-[42px] items-center justify-center rounded-full ${selected ? "bg-brand-500 text-white" : "bg-sage-200 text-sage-900"}`}>
              <Icon size={20} strokeWidth={2.75} />
            </span>
            <span className="flex flex-col gap-0.5">
              <span className="font-heading text-[21px] leading-tight text-ink dark:text-zinc-100">{name}</span>
              <span className="text-[12.5px] font-bold leading-snug text-sand-700 dark:text-zinc-400">{COPY[kind]}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
