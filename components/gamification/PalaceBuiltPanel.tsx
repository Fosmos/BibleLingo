"use client";

import { useState } from "react";
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import type { BuiltPalace } from "@/types";
import { addRoom, newPalaceId, removeRoom, updateRoom } from "@/lib/builtPalaces";

interface PalaceBuiltPanelProps {
  pathKey: string;
  palace: BuiltPalace | undefined;
  onSave: (palace: BuiltPalace) => void;
}

const FIELD = "w-full rounded-xl border border-sand-300 bg-paper px-3 py-2 text-[14px] text-ink dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100";

// The top of the Palace tab: the place the reader builds this path's palace in — a real place they
// know, its rooms in walking order (renamed, added, removed here). With none yet, it offers to start
// one. The spots themselves are made where their verses are, passage by passage (PassageSpots.tsx),
// and as verses are learned (PalacePlaceStep.tsx).
export function PalaceBuiltPanel({ pathKey, palace, onSave }: PalaceBuiltPanelProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [removing, setRemoving] = useState<string | null>(null);

  if (!palace)
    return (
      <div className="flex items-center gap-1.5 rounded-[18px] bg-sand-100 p-1.5 pl-3 dark:bg-zinc-900">
        <span className="shrink-0 text-[12.5px] font-black text-ink dark:text-zinc-100">Build a palace in</span>
        <input className={`${FIELD} py-1.5`} value={name} placeholder="my house" aria-label="A place you know well" onChange={(event) => setName(event.target.value)} />
        <button
          type="button"
          onClick={() => name.trim() && onSave({ id: newPalaceId(), name: name.trim(), pathKey, rooms: [{ id: newPalaceId(), name: "Room 1", loci: [] }], createdAt: new Date().toISOString() })}
          className="shrink-0 rounded-xl bg-brand-500 px-3.5 py-2 text-[12.5px] font-black text-white"
        >
          Start
        </button>
      </div>
    );

  const spots = palace.rooms.reduce((sum, room) => sum + room.loci.length, 0);
  return (
    <div className="flex flex-col gap-2 rounded-[18px] bg-sand-100 p-3 dark:bg-zinc-900">
      <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className="flex items-center gap-2 text-left">
        <span className="min-w-0 flex-1 truncate text-[13px] font-black text-ink dark:text-zinc-100">
          {palace.name} <span className="font-extrabold text-ink-muted">· {palace.rooms.length} {palace.rooms.length === 1 ? "room" : "rooms"} · {spots} spots</span>
        </span>
        <ChevronDown size={16} strokeWidth={3} className={`shrink-0 text-sand-600 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <>
          <input key={palace.id} defaultValue={palace.name} aria-label="Palace name" className={`${FIELD} font-bold`} onBlur={(event) => event.target.value.trim() && onSave({ ...palace, name: event.target.value.trim() })} />
          {palace.rooms.map((room, index) => (
            <div key={room.id} className="flex items-center gap-1.5">
              <span className="w-5 shrink-0 text-center text-[12px] font-black text-sand-600">{index + 1}</span>
              <input defaultValue={room.name} aria-label="Room name" className={FIELD} onBlur={(event) => event.target.value.trim() && event.target.value.trim() !== room.name && onSave(updateRoom(palace, room.id, { name: event.target.value.trim() }))} />
              <span className="shrink-0 text-[11px] font-bold text-ink-muted">{room.loci.length} spots</span>
              <button
                type="button"
                aria-label={removing === room.id ? `Tap again to remove ${room.name} and its spots` : `Remove ${room.name}`}
                onClick={() => (removing === room.id ? (onSave(removeRoom(palace, room.id)), setRemoving(null)) : setRemoving(room.id))}
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${removing === room.id ? "bg-heart-100 text-heart-600" : "text-sand-500 hover:bg-sand-200 dark:hover:bg-zinc-800"}`}
              >
                <Trash2 size={16} strokeWidth={2.5} />
              </button>
            </div>
          ))}
          <button type="button" onClick={() => onSave(addRoom(palace).palace)} className="flex items-center justify-center gap-1 rounded-xl border-2 border-dashed border-sand-300 py-2 text-[12.5px] font-black text-sand-700 dark:border-zinc-700 dark:text-zinc-400">
            <Plus size={15} strokeWidth={3} /> Add a room
          </button>
        </>
      )}
    </div>
  );
}
