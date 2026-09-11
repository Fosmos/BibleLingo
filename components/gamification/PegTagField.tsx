"use client";

import { useState } from "react";
import { useProgressStore } from "@/store/useProgressStore";
import { pegMasterListKey, resolvePegWord } from "@/lib/pegSystem";

interface PegTagFieldProps {
  // The number this chip's word comes from — a chapter number, a pericope's own start (or,
  // when PathProgress.sectionEndPegEnabled is on, end) verse number, or a plain verse number
  // (see BuildingRoomView.tsx for which number each scope uses). Not a per-scope key: every
  // chip sharing the same number (mod 100) reads and writes the very same
  // UserProgress.pegMasterList entry — see lib/pegSystem.ts's pegMasterListKey/resolvePegWord.
  n: number;
  className?: string;
}

// One number's Peg word — a small editable chip, pre-filled with lib/pegSystem.ts's
// Major-System recommendation until the reader taps it to type their own word instead. Edits
// here write straight to the reader's Master Peg List (UserProgress.pegMasterList — same map
// the Master Peg List settings page edits, see app/profile/peg-list/page.tsx), so changing a
// number's word anywhere changes it everywhere that number's peg tag shows up. The emoji is
// the recommendation's own, shown only while still displaying that recommendation — once the
// reader picks their own word the emoji drops off rather than sitting next to a word it has
// nothing to do with.
export function PegTagField({ n, className }: PegTagFieldProps) {
  const masterList = useProgressStore((state) => state.pegMasterList);
  const setPegMasterWord = useProgressStore((state) => state.setPegMasterWord);
  const key = pegMasterListKey(n);
  const isOverridden = key in masterList;
  const { word, emoji } = resolvePegWord(n, masterList);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(word);

  function startEditing() {
    setDraft(word);
    setEditing(true);
  }

  function save() {
    const trimmed = draft.trim();
    if (trimmed) setPegMasterWord(key, trimmed);
    setEditing(false);
  }

  if (editing) {
    return (
      <input
        autoFocus
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={save}
        onKeyDown={(event) => {
          if (event.key === "Enter") save();
          if (event.key === "Escape") setEditing(false);
        }}
        placeholder="Type a peg word"
        aria-label="Peg word"
        className={`rounded-full border border-brand-400 bg-white px-3 py-1 text-xs text-ink focus:outline-none dark:bg-zinc-900 dark:text-zinc-100 ${className ?? ""}`}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={startEditing}
      className={`inline-flex items-center gap-1 rounded-full border border-line bg-mist px-3 py-1 text-xs font-medium text-ink-soft hover:bg-line dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 ${className ?? ""}`}
    >
      {!isOverridden && <span aria-hidden="true">{emoji}</span>} {word}
    </button>
  );
}
