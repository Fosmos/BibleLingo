"use client";

import { FlaskConical } from "lucide-react";

interface AutoCompleteButtonProps {
  onClick: () => void;
  // Overrides the default "Auto-complete (testing)" text — e.g. DaySessionController.tsx's
  // "Auto-complete lesson (testing)", which skips the WHOLE day at once rather than just the
  // one drill stage every other caller of this button skips.
  label?: string;
}

export function AutoCompleteButton({ onClick, label }: AutoCompleteButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1.5 self-start rounded-full border border-dashed border-line px-3 py-1 text-xs font-medium text-ink-muted hover:bg-mist dark:border-zinc-600 dark:text-zinc-400 dark:hover:bg-zinc-800"
    >
      <FlaskConical size={14} />
      {label ?? "Auto-complete (testing)"}
    </button>
  );
}
