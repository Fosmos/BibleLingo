"use client";

import type { MemorizedEntity } from "@/types";
import { formatVerseSpanLabel } from "@/lib/chapterContent";

interface SrsDueEntityPickerProps {
  dueEntities: MemorizedEntity[];
  currentEntityId: string;
  onSelect: (entityId: string) => void;
}

// Lets the reader jump to a specific due verse group instead of always reviewing whichever
// one SrsReviewSession picked first — hidden entirely when there's only one due, since
// there'd be nothing to pick between.
export function SrsDueEntityPicker({ dueEntities, currentEntityId, onSelect }: SrsDueEntityPickerProps) {
  if (dueEntities.length <= 1) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {dueEntities.map((candidate) => (
        <button
          key={candidate.id}
          type="button"
          onClick={() => onSelect(candidate.id)}
          className={`rounded-full px-3 py-1.5 text-xs font-medium ${
            candidate.id === currentEntityId
              ? "bg-brand-500 text-white"
              : "bg-mist text-ink-soft hover:bg-line dark:bg-zinc-800 dark:text-zinc-300"
          }`}
        >
          {formatVerseSpanLabel(candidate.book, candidate.chapter, candidate.startVerse, candidate.endVerse)}
        </button>
      ))}
    </div>
  );
}
