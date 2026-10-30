"use client";

import { useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Eye, Trash2, X } from "lucide-react";
import type { Palace3DObject, Palace3DRoomStyle, Palace3DVerseVisual, VerseSegment } from "@/types";
import { OBJECT_CATALOG, objectLabel } from "@/lib/palace3d/objectCatalog";
import { ROOM_STYLES } from "@/lib/palace3d/roomStyles";
import type { Palace3DObjectKind } from "@/types";

const GLASS = "rounded-[20px] bg-zinc-950/75 p-3 text-zinc-100 shadow-organic-lg backdrop-blur-md";

interface BuildTrayProps {
  onAdd: (kind: Palace3DObjectKind) => void;
}

// What you can put in the room, and how to add a room.
export function Palace3DBuildTray({ onAdd }: BuildTrayProps) {
  return (
    <div className={GLASS}>
      <p className="mb-2 text-xs font-bold text-zinc-300">Add an object, or tap a + on a wall for a new room</p>
      <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 [scrollbar-width:none]">
        {OBJECT_CATALOG.map(({ kind, label }) => (
          <button key={kind} type="button" onClick={() => onAdd(kind)} className="shrink-0 rounded-xl bg-white/10 px-3 py-2.5 text-xs font-extrabold hover:bg-white/20">
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

const VISUALS: { visual: Palace3DVerseVisual; label: string }[] = [
  { visual: "words", label: "First words" },
  { visual: "picture", label: "Picture" },
  { visual: "orb", label: "Hidden orb" },
];

interface ObjectPanelProps {
  object: Palace3DObject;
  verse?: VerseSegment;
  onChange: (change: Partial<Palace3DObject>) => void;
  onPickVerse: () => void;
  onDelete: () => void;
  onClose: () => void;
}

// The selected object: its size and turn, its verse, and how that verse shows.
export function Palace3DObjectPanel({ object, verse, onChange, onPickVerse, onDelete, onClose }: ObjectPanelProps) {
  return (
    <div className={`${GLASS} flex flex-col gap-2.5`}>
      <div className="flex items-center justify-between gap-2">
        <span className="font-heading text-[17px]">{objectLabel(object.kind)}</span>
        <span className="flex gap-1">
          <button type="button" onClick={onDelete} aria-label={`Delete ${objectLabel(object.kind)}`} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/20"><Trash2 size={15} strokeWidth={2.5} /></button>
          <button type="button" onClick={onClose} aria-label="Done" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/20"><X size={16} strokeWidth={2.75} /></button>
        </span>
      </div>
      <label className="flex items-center gap-2.5 text-xs font-bold">
        <span className="w-9">Turn</span>
        <input type="range" min={-Math.PI} max={Math.PI} step={0.02} value={object.rotation} onChange={(event) => onChange({ rotation: Number(event.target.value) })} className="min-w-0 flex-1 accent-brand-500" />
      </label>
      <label className="flex items-center gap-2.5 text-xs font-bold">
        <span className="w-9">Size</span>
        <input type="range" min={0.6} max={1.8} step={0.01} value={object.scale} onChange={(event) => onChange({ scale: Number(event.target.value) })} className="min-w-0 flex-1 accent-brand-500" />
      </label>
      <button type="button" onClick={onPickVerse} className="truncate rounded-xl bg-brand-500 px-3 py-2.5 text-left text-[13px] font-black text-white">
        {verse ? verse.reference : "Put a verse here"}
      </button>
      {verse && (
        <div className="grid grid-cols-3 gap-1.5">
          {VISUALS.map(({ visual, label }) => (
            <button key={visual} type="button" aria-pressed={object.visual === visual} onClick={() => onChange({ visual })} className={`rounded-xl px-1 py-2 text-[11px] font-extrabold ${object.visual === visual ? "bg-white text-zinc-900" : "bg-white/10"}`}>
              {label}
            </button>
          ))}
        </div>
      )}
      <p className="text-[11px] font-semibold text-zinc-400">Drag the object to move it.</p>
    </div>
  );
}

interface SheetProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

function Sheet({ title, onClose, children }: SheetProps) {
  return (
    <div className={`${GLASS} flex max-h-[58dvh] flex-col gap-2`}>
      <div className="flex items-center justify-between">
        <span className="font-heading text-[17px]">{title}</span>
        <button type="button" onClick={onClose} aria-label="Close" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10"><X size={16} strokeWidth={2.75} /></button>
      </div>
      <div className="flex min-h-0 flex-col gap-1.5 overflow-y-auto [scrollbar-width:none]">{children}</div>
    </div>
  );
}

interface VersePickerProps {
  verses: VerseSegment[];
  // Verse ids already on an object, and the one on this object.
  placed: Set<string>;
  currentId?: string;
  onPick: (verseId: string | undefined) => void;
  onClose: () => void;
}

export function Palace3DVersePicker({ verses, placed, currentId, onPick, onClose }: VersePickerProps) {
  return (
    <Sheet title="Choose a verse" onClose={onClose}>
      {currentId && <button type="button" onClick={() => onPick(undefined)} className="rounded-xl bg-white/10 px-3 py-2.5 text-left text-xs font-extrabold">Take the verse off</button>}
      {verses.map((verse) => (
        <button key={verse.id} type="button" onClick={() => onPick(verse.id)} className={`rounded-xl px-3 py-2.5 text-left ${verse.id === currentId ? "bg-brand-500 text-white" : "bg-white/10"}`}>
          <span className="flex justify-between gap-2 text-xs font-black">
            {verse.reference}
            {placed.has(verse.id) && verse.id !== currentId && <span className="font-bold text-zinc-400">placed elsewhere</span>}
          </span>
          <span className="block truncate text-xs text-zinc-300">{verse.text}</span>
        </button>
      ))}
    </Sheet>
  );
}

interface RoomPickerProps {
  onPick: (style: Palace3DRoomStyle) => void;
  onClose: () => void;
}

export function Palace3DRoomPicker({ onPick, onClose }: RoomPickerProps) {
  return (
    <Sheet title="Add a room" onClose={onClose}>
      {(Object.keys(ROOM_STYLES) as Palace3DRoomStyle[]).map((style) => (
        <button key={style} type="button" onClick={() => onPick(style)} className="rounded-xl bg-white/10 px-3 py-2.5 text-left hover:bg-white/20">
          <span className="block text-[13px] font-black">{ROOM_STYLES[style].label}</span>
          <span className="block text-xs text-zinc-300">{ROOM_STYLES[style].blurb}</span>
        </button>
      ))}
    </Sheet>
  );
}

interface VerseCardProps {
  verse: VerseSegment;
  position: string;
  onPrevious: () => void;
  onNext: () => void;
}

// The verse you've walked up to: its reference first, so you can try it before showing it.
export function Palace3DVerseCard({ verse, position, onPrevious, onNext }: VerseCardProps) {
  const [shownFor, setShownFor] = useState<string | null>(null);
  const shown = shownFor === verse.id;
  return (
    <div className={`${GLASS} flex flex-col gap-2`}>
      <div className="flex items-center justify-between gap-2">
        <button type="button" onClick={onPrevious} aria-label="Previous verse" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10"><ChevronLeft size={19} strokeWidth={2.75} /></button>
        <span className="min-w-0 text-center">
          <span className="block truncate font-heading text-[17px]">{verse.reference}</span>
          <span className="block text-[11px] font-bold text-zinc-400">{position}</span>
        </span>
        <button type="button" onClick={onNext} aria-label="Next verse" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10"><ChevronRight size={19} strokeWidth={2.75} /></button>
      </div>
      {shown ? (
        <p className="max-h-[28dvh] overflow-y-auto text-[15px] leading-snug">{verse.text}</p>
      ) : (
        <button type="button" onClick={() => setShownFor(verse.id)} className="flex items-center justify-center gap-1.5 rounded-xl bg-white/10 py-2.5 text-xs font-extrabold"><Eye size={14} strokeWidth={2.75} />Say it, then show the verse</button>
      )}
    </div>
  );
}
