"use client";

import { useState } from "react";
import Link from "next/link";
import { RotateCcw } from "lucide-react";
import { useProgressStore } from "@/store/useProgressStore";
import { dueEntitiesInOrder } from "@/lib/srsReviewQueue";
import { useReviewHref } from "@/lib/useReviewHref";

// Home's one way into spaced review: starts everything due. The list itself is in the Memorized
// tab's Review area (MemorizedReviewArea.tsx). Hidden when nothing is due.
export function HomeDueButton() {
  const entities = useProgressStore((state) => state.memorizedEntities);
  const reviewHref = useReviewHref();
  const [now] = useState(() => new Date());
  const due = dueEntitiesInOrder(entities, now);
  if (due.length === 0) return null;
  return (
    <Link href={reviewHref(due.map((entity) => entity.id), true) ?? "/memorized"} className="flex items-center justify-center gap-2 rounded-full bg-brand-500 py-4 text-base font-extrabold text-white shadow-[0_5px_0_#8C491A] hover:bg-brand-600">
      <RotateCcw size={18} strokeWidth={2.75} />
      Review {due.length} {due.length === 1 ? "passage" : "passages"} due
    </Link>
  );
}
