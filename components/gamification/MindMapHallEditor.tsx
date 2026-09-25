"use client";

import { useState, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import type { MindMapPericopeDatum } from "@/lib/mindMapTypes";
import { useProgressStore } from "@/store/useProgressStore";
import { LANDMARK_ICONS } from "@/lib/landmarkIcons";
import { hallDefaultName, hallEmblemKey, hallNameKey } from "@/lib/hallEmblems";

interface MindMapHallEditorProps {
  pericope: MindMapPericopeDatum;
  hallNumber: number | undefined;
  // The hall's Memory Palace place-tag key, when tags are on for sections (see
  // lib/mindMapTagKey.ts) — shows the place-tag field. Undefined hides it.
  tagKey: string | undefined;
  onClose: () => void;
}

// Everything about a hall the reader can make their own — its name, its place tag, and its
// landmark — in one sheet over the whole screen (not on the zoomable canvas), so it's full-size
// and easy to type into on a phone: 16px inputs, which also keeps iOS from zooming the page when
// one is focused. Opened by tapping the hall's plaque or its emblem (MindMapPericopeGateway.tsx).
// Every field saves as it's typed or picked.
export function MindMapHallEditor({ pericope, hallNumber, tagKey, onClose }: MindMapHallEditorProps) {
  const locationTags = useProgressStore((state) => state.locationTags);
  const iconTags = useProgressStore((state) => state.iconTags);
  const setLocationTag = useProgressStore((state) => state.setLocationTag);
  const clearLocationTag = useProgressStore((state) => state.clearLocationTag);
  const setIconTag = useProgressStore((state) => state.setIconTag);
  const clearIconTag = useProgressStore((state) => state.clearIconTag);
  const nameKey = hallNameKey(pericope, tagKey);
  const defaultName = hallDefaultName(hallNumber);
  const [name, setName] = useState(locationTags[nameKey] ?? "");
  const [tag, setTag] = useState(tagKey ? (locationTags[tagKey] ?? "") : "");
  const emblemKey = hallEmblemKey(pericope);
  const chosenEmblem = iconTags[emblemKey];

  function saveText(key: string, value: string) {
    const trimmed = value.trim();
    if (!trimmed || trimmed === defaultName) clearLocationTag(key);
    else setLocationTag(key, trimmed);
  }

  const stop = (event: MouseEvent) => event.stopPropagation();

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" onClick={onClose}>
      <div onClick={stop} className="max-h-[85dvh] w-full max-w-sm overflow-y-auto rounded-t-2xl bg-parchment p-4 shadow-xl sm:rounded-2xl dark:bg-zinc-900">
        <div className="mb-3 flex items-center justify-between gap-2">
          <p className="font-serif text-base font-bold text-ink dark:text-zinc-100">{pericope.label}</p>
          <button type="button" onClick={onClose} aria-label="Done" className="rounded-full p-1 text-ink-muted hover:bg-mist dark:hover:bg-zinc-800">
            <X size={18} />
          </button>
        </div>
        <label className="mb-3 block">
          <span className="mb-1 block text-caption font-semibold uppercase tracking-wide text-ink-muted">Hall name</span>
          <input
            value={name}
            placeholder={defaultName}
            onChange={(event) => {
              setName(event.target.value);
              saveText(nameKey, event.target.value);
            }}
            className="w-full rounded-xl border border-line bg-white px-3 py-2 text-base text-ink focus:border-brand-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </label>
        {tagKey && (
          <label className="mb-3 block">
            <span className="mb-1 block text-caption font-semibold uppercase tracking-wide text-ink-muted">Place tag</span>
            <input
              value={tag}
              placeholder="e.g. the front porch"
              onChange={(event) => {
                setTag(event.target.value);
                saveText(tagKey, event.target.value);
              }}
              className="w-full rounded-xl border border-line bg-white px-3 py-2 text-base text-ink focus:border-brand-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </label>
        )}
        <span className="mb-1 block text-caption font-semibold uppercase tracking-wide text-ink-muted">Landmark</span>
        <div className="grid grid-cols-6 gap-1">
          {LANDMARK_ICONS.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => (id === chosenEmblem ? clearIconTag(emblemKey) : setIconTag(emblemKey, id))}
              aria-label={label}
              aria-pressed={id === chosenEmblem}
              title={label}
              className={`flex aspect-square items-center justify-center rounded-xl border ${
                id === chosenEmblem ? "border-brand-500 bg-brand-50 dark:bg-brand-900/30" : "border-transparent hover:bg-mist dark:hover:bg-zinc-800"
              }`}
            >
              <Icon size={20} className="text-ink-soft dark:text-zinc-300" />
            </button>
          ))}
        </div>
        <button type="button" onClick={onClose} className="mt-4 w-full rounded-full bg-brand-500 py-3 font-semibold text-white">
          Done
        </button>
      </div>
    </div>,
    document.body,
  );
}
