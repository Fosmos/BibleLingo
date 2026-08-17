"use client";

import { motion } from "framer-motion";
import { formatChapterLabel } from "@/lib/chapterContent";
import { TAP_SCALE } from "@/lib/motionTokens";

interface VersePickerProps {
  book: string;
  chapter: number;
  totalVerses: number;
  onSelectVerse: (verse: number) => void;
  onBack: () => void;
}

export function VersePicker({ book, chapter, totalVerses, onSelectVerse, onBack }: VersePickerProps) {
  const verses = Array.from({ length: totalVerses }, (_, index) => index + 1);

  return (
    <div className="flex flex-col gap-4">
      <button type="button" onClick={onBack} className="self-start text-sm font-medium text-brand-600 hover:underline">
        ← Chapters
      </button>
      <h3 className="text-title">{formatChapterLabel(book, chapter)}</h3>
      <p className="text-sm text-ink-muted">Choose a verse.</p>
      <div className="grid grid-cols-6 gap-2 sm:grid-cols-8 md:grid-cols-10">
        {verses.map((verse) => (
          <motion.button
            key={verse}
            type="button"
            whileTap={TAP_SCALE}
            onClick={() => onSelectVerse(verse)}
            aria-label={`Verse ${verse}`}
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500 text-sm font-medium text-white"
          >
            {verse}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
