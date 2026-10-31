"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { isDue } from "@/lib/srs";
import { useProgressStore } from "@/store/useProgressStore";

interface ChapterReviewButtonProps {
  book: string;
  chapter: number;
  onReview: (entityIds: string[]) => void;
}

// A chapter's "Review chapter", held above the tab bar: every range memorized in it, in verse
// order, due or not. Nothing until something in the chapter is memorized.
export function ChapterReviewButton({ book, chapter, onReview }: ChapterReviewButtonProps) {
  const entities = useProgressStore((state) => state.memorizedEntities);
  const [now] = useState(() => new Date());
  const ranges = entities.filter((entity) => entity.book === book && entity.chapter === chapter).sort((a, b) => a.startVerse - b.startVerse);
  if (!ranges.length) return null;
  const due = ranges.filter((entity) => isDue(entity.srs, now)).reduce((sum, entity) => sum + entity.endVerse - entity.startVerse + 1, 0);
  return (
    <div className="fixed inset-x-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-20 mx-auto max-w-md">
      <button type="button" onClick={() => onReview(ranges.map((entity) => entity.id))} className="flex min-h-[56px] w-full items-center justify-center gap-2 rounded-full bg-brand-500 px-5 text-base font-extrabold text-white shadow-organic-md transition-transform hover:bg-brand-600 active:translate-y-0.5">
        <RotateCcw size={18} strokeWidth={2.75} />
        Review chapter
        {due > 0 && <span className="font-bold opacity-80">· {due} due</span>}
      </button>
    </div>
  );
}
