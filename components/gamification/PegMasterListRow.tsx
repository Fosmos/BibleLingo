"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { useProgressStore } from "@/store/useProgressStore";
import { pegMasterListKey, resolvePegWord } from "@/lib/pegSystem";

interface PegMasterListRowProps {
  n: number;
}

// One row of the Master Peg List (see app/profile/peg-list/page.tsx) — a number, its
// recommended (or reader-overridden) word, and an inline-editable text field. Edits here
// write to the very same UserProgress.pegMasterList entry every PegTagField.tsx chip in a
// path view reads and writes for that same number (see lib/pegSystem.ts's
// pegMasterListKey/resolvePegWord) — one shared source of truth, edited from either place.
export function PegMasterListRow({ n }: PegMasterListRowProps) {
  const masterList = useProgressStore((state) => state.pegMasterList);
  const setPegMasterWord = useProgressStore((state) => state.setPegMasterWord);
  const clearPegMasterWord = useProgressStore((state) => state.clearPegMasterWord);
  const key = pegMasterListKey(n);
  const isOverridden = key in masterList;
  const { word, emoji } = resolvePegWord(n, masterList);
  const [draft, setDraft] = useState(word);
  // Keeps the input in sync when this number's effective word changes from elsewhere (a
  // Reset tap below, or an edit from a PegTagField in some path view) while this row isn't
  // the one being typed into — React's "adjusting state when a prop changes" pattern.
  const [lastSyncedWord, setLastSyncedWord] = useState(word);
  if (word !== lastSyncedWord) {
    setLastSyncedWord(word);
    setDraft(word);
  }

  function save() {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== word) setPegMasterWord(key, trimmed);
    else setDraft(word);
  }

  return (
    <div className="flex items-center gap-2 rounded-xl border border-line bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900">
      <span className="w-7 shrink-0 text-sm font-semibold text-ink-muted">{key}</span>
      <span aria-hidden="true" className="w-5 shrink-0 text-center">
        {!isOverridden && emoji}
      </span>
      <input
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={save}
        onKeyDown={(event) => {
          if (event.key === "Enter") (event.target as HTMLInputElement).blur();
        }}
        aria-label={`Peg word for ${key}`}
        className="flex-1 rounded-lg border border-line bg-white px-2 py-1 text-sm text-ink focus:border-brand-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
      />
      {isOverridden && (
        <button
          type="button"
          onClick={() => clearPegMasterWord(key)}
          aria-label={`Reset ${key} to the recommended word`}
          className="shrink-0 rounded-full p-1 text-ink-muted hover:bg-mist hover:text-ink dark:hover:bg-zinc-800"
        >
          <RotateCcw size={14} />
        </button>
      )}
    </div>
  );
}
