"use client";

import { splitWordPunctuation } from "@/lib/verseWords";
import { useLessonSessionStore } from "@/store/useLessonSessionStore";

export type HiddenWordTone = "pending" | "target" | "error" | "filled";

interface HiddenWordProps {
  word: string;
  // Shows the word's first letter in its pill as a hint, the rest still hidden (hint stages).
  firstLetter?: boolean;
  // Shows the word's last letter in its pill (the Last letters stage) — never on a one-letter word,
  // where it would be the answer.
  lastLetter?: boolean;
  // Waiting (a grey pill), the word asked for now (ringed in terracotta), a wrong try (ringed in
  // red), or typed — filled shows the whole word.
  tone?: HiddenWordTone;
  // Leaves out the word's punctuation too, so a blind recall shows nothing of the sentence's shape.
  bare?: boolean;
}

const PILL: Record<Exclude<HiddenWordTone, "filled">, string> = {
  pending: "bg-sand-300 dark:bg-zinc-700",
  target: "bg-brand-100 ring-2 ring-inset ring-brand-500 dark:bg-brand-900/40",
  error: "bg-heart-100 ring-2 ring-inset ring-heart-500 dark:bg-heart-500/20",
};

// A word a lesson stage is hiding: a grey pill exactly as wide as its letters, so the reader can
// see how long the word is, its punctuation beside it — with the first (or last) letter showing on
// a hint stage. Once typed, the whole word shows in its place. `indent-0`: an inline-block would
// otherwise re-apply SenseLineRow.tsx's hanging `-indent-5` to its own text.
export function HiddenWord({ word, firstLetter = false, lastLetter = false, tone = "pending", bare = false }: HiddenWordProps) {
  const pills = useLessonSessionStore((state) => state.blankPills);
  const { lead, core, trail } = splitWordPunctuation(word);
  if (!core) return <>{bare ? "" : word}</>;
  if (tone === "filled") return <>{word}</>;
  // Spaced review shows no pills: a waiting word just keeps its room, so nothing moves as it's typed.
  if (!pills && tone === "pending" && !firstLetter && !lastLetter) return <span className="invisible" aria-hidden="true">{word}</span>;
  const showFirst = firstLetter;
  const showLast = lastLetter && core.length > 1;
  const middle = core.slice(showFirst ? 1 : 0, showLast ? -1 : undefined);
  return (
    <>
      {!bare && lead}
      <span className={`-mx-[.06em] inline-block whitespace-nowrap rounded-md px-[.06em] indent-0 leading-tight text-ink-soft dark:text-zinc-300 ${PILL[tone]}`}>
        {showFirst && core[0]}
        <span className="invisible" aria-hidden="true">
          {middle}
        </span>
        {showLast && core[core.length - 1]}
      </span>
      {!bare && trail}
    </>
  );
}
