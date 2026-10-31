"use client";

import { MapPin } from "lucide-react";
import type { BuiltRoom } from "@/types";

interface ReaderChapterTagProps {
  room: BuiltRoom;
  // Unset while a lesson or review runs: the tag shows, but isn't edited in a lesson.
  onTap?: () => void;
}

const CARD = "grid w-full grid-cols-[38px_minmax(0,1fr)] gap-2 rounded-[18px] bg-sand-100 px-3.5 py-2.5 text-left dark:bg-zinc-900";

// A chapter's memory palace room under its title in the reader: where the chapter happens, and what's
// happening there. The verses' own loci sit inside it, further down (ReaderLocusTag.tsx).
export function ReaderChapterTag({ room, onTap }: ReaderChapterTagProps) {
  const body = (
    <>
      <span className="flex h-[26px] items-center justify-center text-brand-700 dark:text-brand-300">
        <MapPin size={19} strokeWidth={2.5} />
      </span>
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="truncate font-heading text-[19px] leading-[26px] text-brand-800 dark:text-brand-300">{room.name}</span>
        {room.scene && <span className="text-[14px] italic leading-snug text-sand-700 dark:text-zinc-400">{room.scene}</span>}
      </span>
    </>
  );
  if (!onTap) return <div className={CARD}>{body}</div>;
  return (
    <button type="button" onClick={onTap} className={CARD}>
      {body}
    </button>
  );
}
