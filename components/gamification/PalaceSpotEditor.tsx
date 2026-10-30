import { Check, Trash2 } from "lucide-react";
import type { BuiltLocus, BuiltPalace, VerseSegment } from "@/types";
import { moveLocus, removeLocus, updateLocus } from "@/lib/builtPalaces";
import { VerseRangePicker } from "@/components/gamification/VerseRangePicker";

interface PalaceSpotEditorProps {
  palace: BuiltPalace;
  roomId: string;
  locus: BuiltLocus;
  // The path's verses it can hold.
  verses: VerseSegment[];
  onSave: (palace: BuiltPalace) => void;
  onDone: () => void;
}

const FIELD = "w-full rounded-xl border border-sand-300 bg-paper px-3 py-2 text-[14px] text-ink dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100";

// One spot in the reader's built palace, opened for editing where its verses are in the Palace tab
// (PassageSpots.tsx): which room it's in, where it is, which verses sit there, and the scene they
// picture tying them to it. Text saves when you leave the field.
export function PalaceSpotEditor({ palace, roomId, locus, verses, onSave, onDone }: PalaceSpotEditorProps) {
  const commit = (field: "name" | "scene") => (event: { target: { value: string } }) => {
    const value = event.target.value.trim();
    if (value !== (locus[field] ?? "")) onSave(updateLocus(palace, roomId, locus.id, { [field]: value || undefined }));
  };

  return (
    <div className="flex flex-col gap-2 rounded-[16px] border-2 border-brand-300 bg-paper p-2.5 dark:border-brand-800 dark:bg-zinc-900">
      <div className="flex items-center gap-1.5">
        <select aria-label="Room" className={`${FIELD} w-auto max-w-[42%] font-bold`} value={roomId} onChange={(event) => onSave(moveLocus(palace, roomId, locus.id, event.target.value))}>
          {palace.rooms.map((room) => (
            <option key={room.id} value={room.id}>
              {room.name}
            </option>
          ))}
        </select>
        <input key={locus.id} defaultValue={locus.name} placeholder="Where? The fridge" aria-label="Spot" onBlur={commit("name")} className={`${FIELD} font-bold`} />
        <button type="button" onClick={() => onSave(removeLocus(palace, roomId, locus.id))} aria-label="Remove this spot" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sand-500 hover:bg-sand-100 dark:hover:bg-zinc-800">
          <Trash2 size={17} strokeWidth={2.5} />
        </button>
      </div>
      <VerseRangePicker verses={verses} value={locus.range} onChange={(range) => onSave(updateLocus(palace, roomId, locus.id, { range }))} />
      <textarea
        key={`${locus.id}-scene`}
        defaultValue={locus.scene}
        placeholder="Picture it here — a crown stuck to the fridge door"
        aria-label="Scene"
        rows={2}
        onBlur={commit("scene")}
        className={`${FIELD} resize-none italic`}
      />
      <button type="button" onClick={onDone} className="flex items-center justify-center gap-1 self-end rounded-full bg-sand-200 px-3.5 py-1.5 text-[12px] font-black text-ink dark:bg-zinc-800 dark:text-zinc-100">
        <Check size={14} strokeWidth={3} /> Done
      </button>
    </div>
  );
}
