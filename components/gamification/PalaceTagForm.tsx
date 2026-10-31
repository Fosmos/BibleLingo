"use client";

import { useState } from "react";

interface PalaceTagFormProps {
  label: string;
  placeholder: string;
  name: string;
  scene: string;
  onSave: (name: string, scene: string) => void;
  // Taking the tag off, where that's possible.
  onRemove?: () => void;
}

const FIELD = "w-full rounded-xl border border-sand-300 bg-paper px-3 py-2.5 text-[15px] font-medium text-ink dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100";
const LABEL = "flex flex-col gap-1 text-[13px] font-extrabold text-sand-700 dark:text-zinc-400";

// A memory palace tag on a whole book or chapter (ReaderLocusSheet.tsx): its name and what's happening there.
export function PalaceTagForm({ label, placeholder, name: startName, scene: startScene, onSave, onRemove }: PalaceTagFormProps) {
  const [name, setName] = useState(startName);
  const [scene, setScene] = useState(startScene);
  return (
    <>
      <label className={LABEL}>
        {label}
        <input value={name} onChange={(event) => setName(event.target.value)} placeholder={placeholder} className={FIELD} />
      </label>
      <label className={LABEL}>
        What&apos;s happening there
        <textarea value={scene} onChange={(event) => setScene(event.target.value)} rows={2} placeholder="Describe the scene you picture here" className={`${FIELD} resize-none`} />
      </label>
      <button type="button" disabled={!name.trim()} onClick={() => onSave(name.trim(), scene.trim())} className="min-h-14 rounded-full bg-brand-500 text-base font-extrabold text-white shadow-[0_5px_0_#8C491A] disabled:opacity-40">
        Save
      </button>
      {onRemove && (
        <button type="button" onClick={onRemove} className="min-h-11 text-[14px] font-extrabold text-heart-600">
          Remove this tag
        </button>
      )}
    </>
  );
}
