"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { TrailStop } from "@/lib/trailStops";
import { pictureById } from "@/lib/verseImages";
import { parseToSenseLines } from "@/lib/senseLines";

interface BookStructureStoryboardProps {
  // The passage's verse lessons, in order, and each one's picture (lib/verseImages.ts).
  lessons: TrailStop[];
  pictures: string[];
}

// A verse's first few words, as the cue to say the rest.
const OPENING_WORDS = 3;
function openingWords(text: string): string {
  const words = text.trim().split(/\s+/);
  return words.length > OPENING_WORDS ? `${words.slice(0, OPENING_WORDS).join(" ")}…` : words.join(" ");
}

// A passage as a storyboard (BookStructurePassage.tsx) — dual coding, a panel per verse: its picture
// big (picked from its first sense line — lib/verseImages.ts), its number and its opening words, sage
// once learned, the verse you're up to ringed in orange. Tap a panel to flip it to the whole verse in
// sense lines, and again to flip it back: look at the picture, say the verse, flip to check.
export function BookStructureStoryboard({ lessons, pictures }: BookStructureStoryboardProps) {
  const [flipped, setFlipped] = useState<Set<number>>(() => new Set());
  const flip = (index: number) =>
    setFlipped((open) => {
      const next = new Set(open);
      if (!next.delete(index)) next.add(index);
      return next;
    });

  return (
    <div className="grid grid-cols-4 gap-1.5">
      {lessons.map((stop, index) => {
        const verse = stop.verse!;
        const learned = stop.state === "done";
        const Icon = pictureById(pictures[index])?.Icon;
        const open = flipped.has(index);
        return (
          <motion.button
            key={stop.key}
            type="button"
            onClick={() => flip(index)}
            aria-label={open ? `Verse ${verse.verseNumber} — show its picture` : `Verse ${verse.verseNumber} — show the verse`}
            aria-pressed={open}
            initial={false}
            animate={{ rotateY: open ? 180 : 0 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className={`relative min-h-[112px] rounded-[12px] border-2 bg-paper text-left [transform-style:preserve-3d] dark:bg-zinc-900 ${stop.state === "current" ? "border-brand-500" : "border-sand-200 dark:border-zinc-800"}`}
          >
            <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 p-1.5 [backface-visibility:hidden]">
              <span className={`flex h-10 w-10 items-center justify-center rounded-[10px] ${learned ? "bg-sage-500 text-white shadow-[0_3px_0_#56633F]" : "bg-sand-200 text-sand-500 dark:bg-zinc-800 dark:text-zinc-500"}`}>
                {Icon && <Icon size={21} strokeWidth={2.2} />}
              </span>
              <span className="text-[10px] font-extrabold text-sand-600 dark:text-zinc-500">{verse.verseNumber}</span>
              <span className="text-center font-heading text-[11.5px] leading-tight text-ink dark:text-zinc-100">{openingWords(verse.text)}</span>
            </span>
            <span className="absolute inset-0 flex flex-col gap-0.5 overflow-y-auto p-1.5 [backface-visibility:hidden] [transform:rotateY(180deg)] [scrollbar-width:none]">
              <span className="text-[10px] font-extrabold text-sand-600 dark:text-zinc-500">{verse.verseNumber}</span>
              {parseToSenseLines(verse.text).map((line, at) => (
                <span key={at} className="pl-2 -indent-2 text-[10.5px] leading-snug text-ink dark:text-zinc-100">
                  {line}
                </span>
              ))}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
