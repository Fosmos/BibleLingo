"use client";

import { useState } from "react";
import { MapPin, Plus } from "lucide-react";
import type { VerseSegment } from "@/types";
import { findPlacement, newSpot, roomFor } from "@/lib/palacePlacement";
import type { PalaceContext } from "@/components/gamification/BookStructureChapter";
import { PassageSpots } from "@/components/gamification/PassageSpots";

interface VerseSpotLinkProps {
  built: PalaceContext;
  verse: VerseSegment;
}

// A verse's spot in the reader's palace, in its sheet: tap to edit it, or to place the verse on a new one.
export function VerseSpotLink({ built, verse }: VerseSpotLinkProps) {
  const [editing, setEditing] = useState(false);
  const spot = built.spotOf(verse);
  const open = () => {
    if (!findPlacement([built.palace], verse)) {
      const ref = { book: verse.book, chapter: verse.chapter, verseNumber: verse.verseNumber };
      built.onSave(newSpot(built.palace, roomFor(built.palace, ref)?.id ?? null, ref, "", ""));
    }
    setEditing(true);
  };
  return (
    <>
      <button type="button" onClick={open} className="flex min-h-11 min-w-0 items-center gap-1 self-start text-left text-[13px] font-black text-brand-700 dark:text-brand-300">
        {spot ? <MapPin size={13} strokeWidth={3} className="shrink-0" /> : <Plus size={13} strokeWidth={3} className="shrink-0" />}
        <span className="truncate">{spot || "Place it in your palace"}</span>
      </button>
      {editing && <PassageSpots palace={built.palace} verse={verse} pathVerses={built.pathVerses} onSave={built.onSave} onDone={() => setEditing(false)} />}
    </>
  );
}
