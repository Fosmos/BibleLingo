"use client";

import type { VerseSegment } from "@/types";

interface SleepTimerVersePickerProps {
  verses: VerseSegment[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
}

// SleepTimerView.tsx's own idle-screen checklist — every memorized verse defaults to selected
// (see that file's own lazy initial state); tap one to drop it from tonight's loop without
// touching which verses are actually memorized anywhere else in the app. Session-only — it
// resets back to "everything" the next time Sleep Timer opens, same as the duration picker
// next to it never remembering a past choice either.
export function SleepTimerVersePicker({ verses, selectedIds, onToggle }: SleepTimerVersePickerProps) {
  return (
    <div className="flex w-full max-w-sm flex-1 flex-col gap-0.5 overflow-y-auto rounded-2xl bg-vespers-surface p-2 text-left">
      {verses.map((verse) => {
        const selected = selectedIds.has(verse.id);
        return (
          <button
            key={verse.id}
            type="button"
            onClick={() => onToggle(verse.id)}
            aria-pressed={selected}
            className={`flex shrink-0 items-center justify-between rounded-xl px-3 py-2 text-sm hover:bg-vespers-bg ${
              selected ? "text-vespers-ink" : "text-vespers-soft/50 line-through"
            }`}
          >
            <span>{verse.reference}</span>
            <span
              className={`flex h-4 w-4 shrink-0 rounded-full border ${
                selected ? "border-vespers-accent bg-vespers-accent" : "border-vespers-soft/40"
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}
