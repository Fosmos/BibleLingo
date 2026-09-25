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
// list of any kind: this is the one place every level (book/chapter/verse — a pericope now
// edits its own tag in the Mind Map hall editor instead, see MindMapHallEditor.tsx)
// reads and writes UserProgress.locationTags — see lib/locationTags.ts's locationTagKey.
export function LocationTagField({ tagKey, className }: LocationTagFieldProps) {
  const value = useProgressStore((state) => state.locationTags[tagKey]);
  const setLocationTag = useProgressStore((state) => state.setLocationTag);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");
  const sizeClass = "gap-1 px-3 py-1 text-xs";
  const iconSize = 11;

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
        className={`rounded-full border border-brand-500 bg-white text-ink focus:outline-none dark:bg-zinc-900 dark:text-zinc-100 ${sizeClass} ${className ?? ""}`}
      />
    );
  }

  if (value) {
    return (
      <button
        type="button"
        onClick={startEditing}
        className={`inline-flex items-center rounded-full bg-mist font-medium text-ink-soft hover:bg-line dark:bg-zinc-800 dark:text-zinc-300 ${sizeClass} ${className ?? ""}`}
      >
        <Tag size={iconSize} /> {value}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={startEditing}
      className={`inline-flex items-center rounded-full border border-dashed border-line font-medium text-ink-muted hover:border-brand-500 hover:text-brand-600 dark:border-zinc-700 ${sizeClass} ${className ?? ""}`}
    >
      <Plus size={iconSize} /> Add location tag
    </button>
  );
}
