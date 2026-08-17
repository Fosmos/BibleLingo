"use client";

import { motion } from "framer-motion";
import type { BibleBook } from "@/types";
import { TAP_SCALE } from "@/lib/motionTokens";

interface ChapterGridProps {
  book: BibleBook;
  onSelectChapter: (chapter: number) => void;
  onBack: () => void;
}

export function ChapterGrid({ book, onSelectChapter, onBack }: ChapterGridProps) {
  const chapters = Array.from({ length: book.chapterCount }, (_, index) => index + 1);

  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={onBack}
        className="self-start text-sm font-medium text-brand-600 hover:underline"
      >
        ← All books
      </button>
      <h3 className="text-title">{book.name}</h3>
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
