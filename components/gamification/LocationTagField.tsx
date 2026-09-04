"use client";

import { useState } from "react";
import { Plus, Tag } from "lucide-react";
import { useProgressStore } from "@/store/useProgressStore";

interface LocationTagFieldProps {
  tagKey: string;
  className?: string;
}

// One scope's free-text location tag — a plain "+ Add location tag" button until set, then a
// small chip showing whatever was typed (click either to edit). No suggestions, no predefined
// list of any kind: this is the one place every level (book/chapter/pericope/verse) reads and
// writes UserProgress.locationTags — see lib/locationTags.ts's locationTagKey.
export function LocationTagField({ tagKey, className }: LocationTagFieldProps) {
  const value = useProgressStore((state) => state.locationTags[tagKey]);
  const setLocationTag = useProgressStore((state) => state.setLocationTag);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");

  function startEditing() {
    setDraft(value ?? "");
    setEditing(true);
  }

  function save() {
    const trimmed = draft.trim();
    if (trimmed) setLocationTag(tagKey, trimmed);
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
        placeholder="Type a location"
        aria-label="Location tag"
        className={`rounded-full border border-brand-500 bg-white px-3 py-1 text-xs text-ink focus:outline-none dark:bg-zinc-900 dark:text-zinc-100 ${className ?? ""}`}
      />
    );
  }

  if (value) {
    return (
      <button
        type="button"
        onClick={startEditing}
        className={`inline-flex items-center gap-1 rounded-full bg-mist px-3 py-1 text-xs font-medium text-ink-soft hover:bg-line dark:bg-zinc-800 dark:text-zinc-300 ${className ?? ""}`}
      >
        <Tag size={11} /> {value}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={startEditing}
      className={`inline-flex items-center gap-1 rounded-full border border-dashed border-line px-3 py-1 text-xs font-medium text-ink-muted hover:border-brand-500 hover:text-brand-600 dark:border-zinc-700 ${className ?? ""}`}
    >
      <Plus size={11} /> Add location tag
    </button>
  );
}
