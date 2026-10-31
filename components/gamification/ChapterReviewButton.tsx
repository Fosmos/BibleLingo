"use client";

import { RotateCcw } from "lucide-react";
import { useProgressStore } from "@/store/useProgressStore";

interface ChapterReviewButtonProps {
  book: string;
  chapter: number;
  onReview: (entityIds: string[]) => void;
}

// A chapter's "Review chapter": every range memorized in it, in verse order, due or not. Nothing
// until something in the chapter is memorized.
export function ChapterReviewButton({ book, chapter, onReview }: ChapterReviewButtonProps) {
  const entities = useProgressStore((state) => state.memorizedEntities);
  const ranges = entities.filter((entity) => entity.book === book && entity.chapter === chapter).sort((a, b) => a.startVerse - b.startVerse);
  if (!ranges.length) return null;
  return (
    <button type="button" onClick={() => onReview(ranges.map((entity) => entity.id))} className="flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full border-2 border-brand-500 bg-white text-[15px] font-extrabold text-brand-800 dark:bg-zinc-900 dark:text-brand-300">
      <RotateCcw size={16} strokeWidth={2.75} />
      Review chapter
    </button>
  );
}
