"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { VerseSegment } from "@/types";
import { objectLabel } from "@/lib/palace3d/objectCatalog";
import type { BookObject } from "@/lib/palaceBook";
import { parseToSenseLines } from "@/lib/senseLines";
import { MOTION_DURATION, MOTION_EASE } from "@/lib/motionTokens";

interface PalaceBookSheetProps {
  object: BookObject;
  room: string;
  verse: VerseSegment;
  onClose: () => void;
}

// A tapped object: what it is and which verse sits there. Say it from memory, then check.
export function PalaceBookSheet({ object, room, verse, onClose }: PalaceBookSheetProps) {
  const [shown, setShown] = useState(false);
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-ink/40" />
      <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} transition={{ duration: MOTION_DURATION.base, ease: MOTION_EASE.enter }} className="relative flex max-h-[80vh] flex-col gap-3 overflow-y-auto rounded-t-[32px] bg-paper px-[22px] pb-[calc(1.9rem+env(safe-area-inset-bottom))] pt-5 shadow-organic-lg dark:bg-zinc-950">
        <div className="flex flex-col gap-0.5">
          <span className="text-[13px] font-bold text-sand-700 dark:text-zinc-400">
            {objectLabel(object.kind)} · {room}
          </span>
          <h2 className="font-heading text-[26px] leading-tight text-ink dark:text-zinc-100">{verse.reference}</h2>
        </div>
        {shown ? (
          <div className="flex flex-col gap-1 rounded-[20px] bg-[#FEFDFB] p-4 text-[15px] leading-[1.5] text-ink dark:bg-zinc-900 dark:text-zinc-100">
            {parseToSenseLines(verse.text).map((line, at) => (
              <p key={at}>{line}</p>
            ))}
          </div>
        ) : (
          <button type="button" onClick={() => setShown(true)} className="w-full rounded-full bg-brand-500 py-4 text-base font-extrabold text-white shadow-[0_5px_0_#8C491A]">
            Show the verse
          </button>
        )}
      </motion.div>
    </div>
  );
}
