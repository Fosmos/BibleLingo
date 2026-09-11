"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { useProgressStore } from "@/store/useProgressStore";
import { VERSE_ICON_OPTIONS, verseIconById } from "@/lib/verseIcons";

interface IconTagFieldProps {
  tagKey: string;
  className?: string;
}

// A verse's own dual-coding icon — a small, fixed vocabulary of shapes (see lib/verseIcons.ts)
// the reader picks to associate with a verse, reused every time they see it again: in the
// margin here (see ChapterVerseRun.tsx) and inline wherever the Building view shows that
// verse's own scope. Same tap-to-edit chip pattern as PegTagField.tsx/LocationTagField.tsx,
// just picking from a curated icon grid instead of typing free text.
export function IconTagField({ tagKey, className }: IconTagFieldProps) {
  const iconId = useProgressStore((state) => state.iconTags[tagKey]);
  const setIconTag = useProgressStore((state) => state.setIconTag);
  const clearIconTag = useProgressStore((state) => state.clearIconTag);
  const [pickerOpen, setPickerOpen] = useState(false);
  const chosen = verseIconById(iconId);

  if (pickerOpen) {
    return (
      <div className={`relative ${className ?? ""}`}>
        <button type="button" aria-hidden="true" tabIndex={-1} onClick={() => setPickerOpen(false)} className="fixed inset-0 z-10 cursor-default" />
        <div className="absolute left-0 top-0 z-20 grid w-56 grid-cols-4 gap-1 rounded-2xl border border-line bg-white p-2 shadow-md dark:border-zinc-700 dark:bg-zinc-900">
          {VERSE_ICON_OPTIONS.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setIconTag(tagKey, id);
                setPickerOpen(false);
              }}
              aria-label={label}
              className={`flex h-11 w-11 items-center justify-center rounded-xl border transition-colors ${
                id === iconId ? "border-brand-500 bg-brand-50 dark:bg-brand-900/30" : "border-transparent hover:bg-mist dark:hover:bg-zinc-800"
              }`}
            >
              <Icon size={18} className="text-ink-soft dark:text-zinc-300" />
            </button>
          ))}
          {chosen && (
            <button
              type="button"
              onClick={() => {
                clearIconTag(tagKey);
                setPickerOpen(false);
              }}
              aria-label="Remove icon"
              className="flex h-11 w-11 items-center justify-center rounded-xl text-heart-600 hover:bg-mist dark:hover:bg-zinc-800"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>
    );
  }

  if (chosen) {
    return (
      <button
        type="button"
        onClick={() => setPickerOpen(true)}
        aria-label={`Change icon (currently ${chosen.label})`}
        className={`inline-flex h-7 w-7 items-center justify-center rounded-full bg-mist text-ink-soft hover:bg-line dark:bg-zinc-800 dark:text-zinc-300 ${className ?? ""}`}
      >
        <chosen.Icon size={14} />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setPickerOpen(true)}
      aria-label="Add icon"
      className={`inline-flex h-7 w-7 items-center justify-center rounded-full border border-dashed border-line text-ink-muted hover:border-brand-500 hover:text-brand-600 dark:border-zinc-700 ${className ?? ""}`}
    >
      <span className="text-xs leading-none">+</span>
    </button>
  );
}
