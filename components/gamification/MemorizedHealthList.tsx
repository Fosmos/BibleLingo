"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useProgressStore } from "@/store/useProgressStore";
import { groupHealth, type HealthSort, type HealthTone } from "@/lib/memorizedHealth";
import { useReviewHref } from "@/lib/useReviewHref";
import { HealthCard } from "@/components/gamification/HealthCard";

const SORTS: { id: HealthSort; label: string }[] = [
  { id: "due", label: "Due first" },
  { id: "book", label: "By book" },
  { id: "recent", label: "Recent" },
];

const DOT_CLASS: Record<HealthTone, string> = {
  due: "bg-brand-500",
  rooted: "bg-sage-700",
  growing: "bg-sage-400",
  book: "bg-sage-500",
};

// The Memorized page's Health list (the Organic restyle) — every memorized range with how strong
// it is and when it's due, sorted due-first, by book or by most recent review. A card starts that
// range's review on the Mind Map (lib/useReviewArrival.ts), or the standalone review without an
// active path. Moving ranges between boxes by hand lives in the Mind Map's Leitner panel.
export function MemorizedHealthList() {
  const entities = useProgressStore((state) => state.memorizedEntities);
  const reviewHref = useReviewHref();
  const [sort, setSort] = useState<HealthSort>("due");
  const [now] = useState(() => new Date());
  const groups = useMemo(() => groupHealth(entities, sort, now), [entities, sort, now]);

  // Reviewed in place on the path it was memorized on (lib/useReviewHref.ts).
  const href = (id: string) => reviewHref([id], true) ?? "/memorized/review";

  return (
    <section className="flex flex-col gap-3.5">
      <div className="flex items-center gap-3">
        <h2 className="text-[22px] text-ink dark:text-zinc-100">Health</h2>
        <Link href="/memorized/mastery" className="ml-auto text-[13px] font-bold text-brand-700 hover:underline dark:text-brand-300">
          Mastery mode
        </Link>
      </div>
      {entities.length === 0 ? (
        <p className="text-sm text-ink-muted">
          Nothing here yet — a verse group joins spaced review once you finish its whole path (or chapter, for a book), or you add one you
          already know below.
        </p>
      ) : (
        <>
          <div role="tablist" aria-label="Sort" className="flex gap-1 self-start rounded-full bg-sand-200 p-1 dark:bg-zinc-800">
            {SORTS.map((option) => (
              <button
                key={option.id}
                type="button"
                role="tab"
                aria-selected={sort === option.id}
                onClick={() => setSort(option.id)}
                className={`rounded-full px-3.5 py-1.5 text-[13px] font-bold transition-colors ${
                  sort === option.id
                    ? "bg-paper text-ink shadow-[inset_0_0_0_2px_theme(colors.brand.500)] dark:bg-zinc-900 dark:text-zinc-100"
                    : "text-ink-soft hover:text-ink dark:text-zinc-400"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          {groups.map((group) => (
            <div key={group.key} className="flex flex-col gap-2.5">
              <p className="flex items-center gap-2 text-[13px] font-bold text-ink-soft dark:text-zinc-400">
                <span className={`h-2.5 w-2.5 rounded-full ${DOT_CLASS[group.tone]}`} />
                {group.label}
                <span className="font-semibold text-ink-muted">{group.entities.length}</span>
              </p>
              {group.entities.map((entity) => (
                <HealthCard key={entity.id} entity={entity} href={href(entity.id)} now={now} />
              ))}
            </div>
          ))}
        </>
      )}
    </section>
  );
}
