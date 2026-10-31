"use client";

import { useState } from "react";
import Link from "next/link";
import { RotateCcw } from "lucide-react";
import { useProgressStore } from "@/store/useProgressStore";
import { dueEntitiesInOrder } from "@/lib/srsReviewQueue";
import { useReviewHref } from "@/lib/useReviewHref";

// One button into spaced review, on Home and the Memorized tab: starts everything due. Hidden when
// nothing is due.
export function HomeDueButton({ quiet = false }: { quiet?: boolean }) {
  const entities = useProgressStore((state) => state.memorizedEntities);
  const reviewHref = useReviewHref();
  const [now] = useState(() => new Date());
  const due = dueEntitiesInOrder(entities, now);
  if (due.length === 0) return null;
  const href = reviewHref(due.map((entity) => entity.id), true) ?? "/memorized";
  const label = `Review ${due.length} ${due.length === 1 ? "passage" : "passages"}`;
  if (quiet) {
    return (
      <Link href={href} className="flex items-center justify-center gap-2 rounded-full bg-sand-200 py-3.5 text-[15px] font-extrabold text-ink hover:bg-sand-300 dark:bg-zinc-800 dark:text-zinc-100">
        <RotateCcw size={18} strokeWidth={2.75} />
        {label} due
      </Link>
    );
  }
  return (
    <Link href={href} className="flex min-h-14 items-center justify-between rounded-[18px] bg-sand-200 px-4 text-[15px] font-extrabold text-ink hover:bg-sand-300 dark:bg-zinc-800 dark:text-zinc-100">
      {label}
      <span className="text-[#A82E1E] dark:text-[#F0917F]">Due now ›</span>
    </Link>
  );
}
