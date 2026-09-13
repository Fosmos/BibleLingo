"use client";

import { motion } from "framer-motion";
import type { BibleBook } from "@/types";
import { TAP_SCALE } from "@/lib/motionTokens";

interface ChapterGridProps {
  book: BibleBook;
  onSelectChapter: (chapter: number) => void;
  onBack: () => void;
  // Overridden by GuidedPathFlow.tsx's own "I've already learned some of this" starting-point
  // step, which reuses this same grid to ask a different question than the normal "which
  // chapter do you want to memorize" flow every other caller uses it for.
  backLabel?: string;
  prompt?: string;
}

export function ChapterGrid({ book, onSelectChapter, onBack, backLabel = "← All books", prompt }: ChapterGridProps) {
  const chapters = Array.from({ length: book.chapterCount }, (_, index) => index + 1);

  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={onBack}
        className="self-start text-sm font-medium text-brand-600 hover:underline"
      >
        {backLabel}
      </button>
      <h3 className="text-title">{book.name}</h3>
      {prompt && <p className="text-sm text-ink-muted">{prompt}</p>}
      <div className="grid grid-cols-6 gap-2 sm:grid-cols-8 md:grid-cols-10">
        {chapters.map((chapter) => (
          <motion.button
            key={chapter}
            type="button"
            whileTap={TAP_SCALE}
            onClick={() => onSelectChapter(chapter)}
            aria-label={`${book.name} chapter ${chapter}`}
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg bg-brand-500 text-sm font-medium text-white"
          >
            {chapter}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
